var API_SERVER = "https://buddypair.aegee-zaragoza.org";

var COUNTRIES_ID = 1571810382;
var STUDIES_ID = 488634952;
var FACULTIES_ID = 120507339;
var NATIONALITY_PREF_ID = 909008785;

function getItemsIds() {
  var form = FormApp.getActiveForm();
  var items = form.getItems();
  items.forEach(function(i) {
    Logger.log("%s - %s", i.getId(), i.getTitle());
  });
}

function setupCountries(form) {
  var countries_form = form.getItemById(COUNTRIES_ID).asListItem();
  var nacionality_preference_form = form.getItemById(NATIONALITY_PREF_ID).asListItem();
  var countries = JSON.parse(UrlFetchApp.fetch(API_SERVER + "/api/countries").getContentText());
  var choices = [];
  countries.forEach(function(c) { choices.push(c.country_name); });
  countries_form.setChoiceValues(choices);
  nacionality_preference_form.setChoiceValues(choices);
}

function setupStudies(form) {
  var countries_form = form.getItemById(STUDIES_ID).asListItem();
  var countries = JSON.parse(UrlFetchApp.fetch(API_SERVER + "/api/studies").getContentText());
  var choices = [];
  countries.forEach(function(s) { choices.push(s.name); });
  countries_form.setChoiceValues(choices);
}

function setupFaculties(form) {
  var countries_form = form.getItemById(FACULTIES_ID).asListItem();
  var countries = JSON.parse(UrlFetchApp.fetch(API_SERVER + "/api/faculties").getContentText());
  var choices = [];
  countries.forEach(function(f) { choices.push(f.name); });
  countries_form.setChoiceValues(choices);
}

function setupForm() {
  var form = FormApp.getActiveForm();
  setupCountries(form);
  setupStudies(form);
  setupFaculties(form);
}
