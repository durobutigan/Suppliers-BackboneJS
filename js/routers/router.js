var app = app || {};

(function () {
	'use strict';
	
	var SupplierRouter = Backbone.Router.extend({
		routes: {
			'*id': 'showSupplier'
		},

		showSupplier: function (param) {
			app.supplierId = param || '';
			app.suppliers.trigger('displayDetails');
		}
	});

	app.SupplierRouter = new SupplierRouter();
	Backbone.history.start();
})();