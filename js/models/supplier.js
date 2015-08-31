var app = app || {};

(function () {
	'use strict';

	app.Supplier = Backbone.Model.extend({
		defaults: {
			address: '',
			duns: 'rm-999-9999',
			id: 0,
			name: '',
			risk_score: {},
			favorite: false
		}
	});
})();