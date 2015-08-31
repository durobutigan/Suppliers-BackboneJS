var app = app || {};

(function () {
	'use strict';
	
	var Suppliers = Backbone.Collection.extend({
		model: app.Supplier,
		url: '',
		// Save favorites in browser's local storage
		localStorage: new Backbone.LocalStorage('favorites'),
		nrOfPages: 0,
		comparator: 'order'
	});

	app.suppliers = new Suppliers();
	app.favorites = new Suppliers();
})();
