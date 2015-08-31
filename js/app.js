var app = app || {};

/*Constants*/
var HTTPsecure = 'https://';
var APItoken = '61dbf36d800b2f054361b75169ae1e10';
var DataFilePath = '@api.riskmethods.net/v1/suppliers.json';
var ResultsPerPage = 10;
var PageNumber = 1;
var RiskLevels = ["no", "very-low", "low", "medium", "high"];
var NrOfItemsInRiskInterval = 20; // since risk score of 100 is used as a event, it is excluded with this handling
var MaxMobileScreenWidth = 640;

$(function () {
	'use strict';
	new app.SuppliersView();
});