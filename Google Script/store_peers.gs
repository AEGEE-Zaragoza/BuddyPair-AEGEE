var API_SERVER = "https://buddypair.aegee-zaragoza.org";

var NAME_ID = 1132475089;
var SURNAME_ID = 767531521;
var GENDER_ID = 492717918;
var BIRTHDATE_ID = 967307718;
var NACIONALITY_ID = 1571810382;
var EMAIL_ID = 319937563;
var PHONE_ID = 1343285556;
var STUDIES_ID = 488634952;
var FACULTY_ID = 120507339;
var GENDER_PREF_ID = 2095606090;
var NATIONALITY_PREF_ID = 909008785;
var ERASMUS_LIMIT_ID = 1017896953;
var NOTES_ID = 903137167;
var MEMBER_ID = 1329615045;
var NIA_ID = 1191024120;
var ENGLISH_ID = 764904450;
var NOTIFICATIONS_ID = 191983696;

function dumpResponse(response, form) {
  var peer = {
    name: response.getResponseForItem(form.getItemById(NAME_ID)).getResponse(),
    surname: response.getResponseForItem(form.getItemById(SURNAME_ID)).getResponse(),
    gender: response.getResponseForItem(form.getItemById(GENDER_ID)).getResponse() == "Hombre" ? true : false,
    birthdate: response.getResponseForItem(form.getItemById(BIRTHDATE_ID)).getResponse(),
    nacionality_name: response.getResponseForItem(form.getItemById(NACIONALITY_ID)).getResponse(),
    email: response.getResponseForItem(form.getItemById(EMAIL_ID)).getResponse(),
    phone: response.getResponseForItem(form.getItemById(PHONE_ID)) != null ? response.getResponseForItem(form.getItemById(PHONE_ID)).getResponse() : null,
    studies_name: response.getResponseForItem(form.getItemById(STUDIES_ID)) != null ? response.getResponseForItem(form.getItemById(STUDIES_ID)).getResponse() : null,
    faculty_name: response.getResponseForItem(form.getItemById(FACULTY_ID)) != null ? response.getResponseForItem(form.getItemById(FACULTY_ID)).getResponse() : null,
    register_date: Utilities.formatDate(response.getTimestamp(), 'GMT', 'yyyy-MM-dd HH:mm:ss'),
    gender_preference: response.getResponseForItem(form.getItemById(GENDER_PREF_ID)).getResponse() == "Hombre" ? true : response.getResponseForItem(form.getItemById(GENDER_PREF_ID)).getResponse() == "Mujer" ? false : null,
    nationality_preference: response.getResponseForItem(form.getItemById(NATIONALITY_PREF_ID)) != null ? response.getResponseForItem(form.getItemById(NATIONALITY_PREF_ID)).getResponse() : null,
    erasmus_limit: response.getResponseForItem(form.getItemById(ERASMUS_LIMIT_ID)).getResponse(),
    notes: response.getResponseForItem(form.getItemById(NOTES_ID)).getResponse(),
    aegee_member: response.getResponseForItem(form.getItemById(MEMBER_ID)).getResponse() == "Sí" ? true : false,
    nia: response.getResponseForItem(form.getItemById(NIA_ID)) != null ? response.getResponseForItem(form.getItemById(NIA_ID)).getResponse() : null,
    speaks_english: response.getResponseForItem(form.getItemById(ENGLISH_ID)).getResponse == "Sí" ? true : false,
    notifications: response.getResponseForItem(form.getItemById(NOTIFICATIONS_ID)).getResponse() == "Sí" ? true : false
  };
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ peer: peer })
  };
  UrlFetchApp.fetch(API_SERVER + "/api/peers", options);
}

function onFormSubmit(e) {
  dumpResponse(e.response, e.source);
}

function dumpAllResponses() {
  var form = FormApp.getActiveForm();
  var responses = form.getResponses();
  responses.forEach(function(r) {
    dumpResponse(r, form);
  });
}
