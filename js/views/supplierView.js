var app = app || {};

(function ($) {
	'use strict';

	app.SupplierView = Backbone.View.extend({
		template: _.template($('#supplier-template').html()),

		events: {
			'click .favorites' : 'toggleFavorite'
		},
		
		toggleFavorite: function(e) {
			var newValue = !this.model.get('favorite');
			this.model.set( {favorite: newValue} );
			$('#'+ this.model.id + ' span:last, #h'+ this.model.id + ' span:last').toggleClass('favorite');
		},
		
		render: function () {
			// we are not using tagName to avoid li element inside li
			this.setElement(this.template(this.model.toJSON()));
			return this;
		}
	});
})(jQuery);
