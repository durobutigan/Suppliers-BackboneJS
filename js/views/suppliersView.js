var app = app || {};

(function ($) {
	'use strict';
	app.SuppliersView = Backbone.View.extend({
		el: 'body',

		template: _.template($('#supplier-details-template').html()),

		events: {
			'click a[aria-label]' : 'changePage',
			'click a:not([aria-label])' : 'goToPage',
			'keydown' : 'keyPressed',
			'click h2 span.favorites' : 'toggleFavorite',
			'click .btn-lg' : 'showSupplierListMobile'
		},
		
		initialize: function () {
			// get favorites from local storage
			app.favorites.fetch();
			// collection change listeners
			this.listenTo(app.suppliers, 'add', this.addOneSupplier);
			this.listenTo(app.suppliers, 'displayDetails', this.renderSupplierView);
			this.listenTo(app.suppliers, 'change:favorite', this.favoriteToggled);
			// get data from Riskmethods API
			var loadDataFromServer = this.getDataFromServer(ResultsPerPage, PageNumber);
			var self = this;
			// when file is fetched call ajaxSuccess or ajaxError (deferred/promises pattern)
			$.when(loadDataFromServer).then(self.ajaxSuccess, self.ajaxError);
			this.$list = $('#supplier-list');
			this.$details = $('#supplier-view');
			this.$container = $('div.sidebar');
		},

		getDataFromServer: function(resultsPerPage, pageNumber) {
			$('#loader').show();
			var combinedUrl = HTTPsecure + APItoken + DataFilePath;
			// deferred/promises pattern used to make sure that data is fetched before rendering
			return $.ajax({
				type: 'GET',
				url: combinedUrl,
				context: this,
				data: {'per_page' : resultsPerPage , 'page' : pageNumber},
				beforeSend : function(req) {
					req.setRequestHeader('Authorization', 'Basic ' + btoa(APItoken));
				},
			});
		},
		
		ajaxSuccess: function(data) {
			// set number of pages
			app.suppliers.nrOfPages = data.pagination.total_pages;
			var favorites = app.favorites.pluck('id');
			// create a new model for each model in fetched JSON file
    		_.each(data.suppliers, function(supplier){
				var favorite = false;
				if (_.contains(favorites, supplier.id)) {
					favorite = true;
				}
				var newSupplier = new app.Supplier ({ address: supplier.address, duns: supplier.duns, id: supplier.id,
													name: supplier.name, risk_score: supplier.score_card, favorite: favorite});
				// add a model to collection
				app.suppliers.add(newSupplier);
			});
			this.addPagination();
			$('#loader').hide();
		},
		
		ajaxError: function(jqXHR, textStatus, errorThrown) {
			// Firefox CORS issues are very well known... plug-in "CORS everywhere" or Firefox patch that disables web security are
			// not an option, so this "hack" could be a very poor option... it should better stay commented :-D ...
			// var isFirefox = typeof InstallTrigger !== 'undefined';
			// if (isFirefox) { jqXHR.status = 999; }
			$('#loader, .row').hide();
			var $message = $('#message');
			$message.removeClass('hidden');
			var $textEl = $message.children(':first');
			switch (jqXHR.status) {
				case 0:	
				case 401:
					$textEl.text('Authorization failed - invalid token!');
					break;
				case 404:
					$textEl.text('Content not found!');
					break;
				case 500:
					$textEl.text('Server error! Please try again later.');
					break;
				default:
					$textEl.text('Your browser does not support cross origin requests!');
					break;
			}
			//console.log('Error: ' + jqXHR.status + ' ' + textStatus + ' ' + errorThrown);
		},
		
		addOneSupplier: function(supplier) {
			// risk_level is not a logical part of a model (avoiding redundancy) - it is only for rendering purposes so it is set here
			supplier.set({ risk_level : this.determineRiskLevel(supplier.get('risk_score').risk_score)});
			var supplierView = new app.SupplierView({ model: supplier });
			this.$list.append(supplierView.render().el);
		},
		
		determineRiskLevel: function (risk) {
			// place risk in a risk level group by dividing it with nr of items in interval
			var riskLevel = Math.floor(risk / NrOfItemsInRiskInterval);
			// return risk level name from enumerator
			return RiskLevels[riskLevel];
		},
		
		changePage: function(e) {
			// this function is called when next or previous page button is clicked
			if (this.canChangePage(e)){
				var currentPageNr = this.getCurrentPage();
				// check if "next" or "previous" button clicked
				var newPageNr = e.currentTarget.getAttribute('aria-label');
				switch(newPageNr) {
					case "Previous":
						newPageNr = currentPageNr - 1;
						break;
					case "Next":
						newPageNr = currentPageNr + 1;
						break;
					default:
						throw new Error ('Unknown change page parameter!');
				}
				var activePage = document.getElementById('page' + newPageNr);
				this.handlePageNavigation(newPageNr, activePage);
			}
		},
		
		goToPage: function(e) {
			// this function is called when page number is clicked
			if (this.canChangePage(e)){
				var newPageNr = parseInt(e.currentTarget.innerText, 10);
				this.handlePageNavigation(newPageNr, e.currentTarget.parentNode);
			}
		},

		canChangePage: function(e) {
			// if user clicked on active or disabled item, do nothing
			var escapeClasses = ['active', 'disabled'];
			var currentClass = e.currentTarget.parentNode.className;
			if (_.contains(escapeClasses, currentClass)) return false;
			return true;
		},		
		
		handlePageNavigation: function (newPageNr, activePage) {
			var currentPageNr = this.getCurrentPage();
			var nrOfPages = app.suppliers.nrOfPages;
			// if valid page number
			if (this.isNumberBetween(newPageNr, 1, nrOfPages)){
				this.setActiveElement(activePage, currentPageNr);
				this.generatePageItems(newPageNr);
				this.checkPageNavigation(newPageNr);
			}
		},
				
		generatePageItems: function (newPageNr) {
			// check if page items exist
			var itemsGenerated = $('#supplier-list div.page' + newPageNr);
			$('#supplier-list div').hide();
			// if page items are created (data is cached), display them
			if (itemsGenerated.length > 0) {
				itemsGenerated.show();
			}
			// if there is no cached data, get it from Riskmethods API
			else {
				var getData = this.getDataFromServer(ResultsPerPage, newPageNr);
				$.when(getData).then(this.ajaxSuccess, this.ajaxError);
			}
		},
		
		checkPageNavigation: function(newPage) {
			var nrOfPages = app.suppliers.nrOfPages;
			// if first page is active, disable previous page button
			if (newPage == 1) {
				$('ul.pagination li:first').addClass('disabled');
			}
			// if last page is active, disable next page button
			if (newPage == nrOfPages) {
				$('ul.pagination li:last').addClass('disabled');
			}
		},
		
		getActiveElement: function() {
			return $('li.active');
		},
		
		setActiveElement: function(item, currentPage) {
			// remove last active element
			$('ul.pagination li').removeClass();
			// give page number to active items
			$('#supplier-list div:visible').addClass('page' + currentPage);
			item.className += ' active';
		},
		
		getCurrentPage: function() {
			// get page number from active elements' innerText
			return parseInt(this.getActiveElement().children(':first').text(), 10);
		},
		
		isNumberBetween: function(number, start, end) {
			return number >= start && number <= end;
		},
		
		renderSupplierView: function() {
			// reset supplier details page
			this.$details.html('');
			// get supplier that should be rendered
			var item = app.suppliers.get(app.supplierId);
			$('#supplier-list div').removeClass('active');
			$('#' + app.supplierId).addClass('active');
			// render supplier using template stored in this.template and append it
			var rendered = this.template(item.attributes);
			this.$details.append(rendered);
			// mobile version --> display only detailed view, hide list
			if (window.innerWidth < MaxMobileScreenWidth){
				this.$container.hide();
			}
		},
		
		addPagination: function() {
			// skip multiple paginations
			if (!app.sitePaged){
				// render template from index.html and append it
				var template = _.template($('#pagination-template').html());
				var rendered = template(app.suppliers);
				$('#supplier-list-container').append(rendered);
				// set flag to paged to avoid multiple paginations
				app.sitePaged = true;
			}
		},
		
		favoriteToggled: function() {
			// get changed model
			var changedModel = _.filter(app.suppliers.models, '_changing')[0];
			var existingModel = app.favorites.get(changedModel.id);
			// if model is not in local store, create it
			if (!existingModel){
				// create a copy of supplier and add it to favorites
				// referenced copy would destroy original supplier if removed
				app.favorites.create(JSON.parse(JSON.stringify(changedModel)));
			}
			// if model is in local store, delete it
			else {
				existingModel.destroy();
			}
		},
		
		toggleFavorite: function(e) {
			var id = e.currentTarget.parentNode.parentNode.id.replace(/\D/g,'');
			$('#' + id + ' span:last').click();
		},
		
		keyPressed: function(e) {
			// keyboard shotcuts are added --> right for next page, left for previous page
			var code = e.keyCode || e.which;
			switch (code) {
				// left key pressed
				case 37:
					// go to previous page
					$('a[aria-label="Previous"]').click();
					break;
				// right key pressed
				case 39:
					// go to next page
					$('a[aria-label="Next"]').click();
					break;
			}
		},
		
		showSupplierListMobile: function() {
			this.$details.html('');
			this.$container.show();
		}
	});
})(jQuery);