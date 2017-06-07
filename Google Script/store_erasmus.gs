var CURRENT_SEMESTER_ID = 201701;

var API_SERVER = "https://buddypair.aegee-zaragoza.org";
var API_AUTH_TOKEN = "";

var NAME_ID = 531953832;
var SURNAME_ID = 11748525;
var GENDER_ID = 1004317375;
var BIRTHDATE_ID = 86837125;
var NATIONALITY_ID = 2100294570;
var EMAIL_ID = 372518360;
var PHONE_ID = 193103936;
var STUDIES_ID = 22888414;
var FACULTY_ID = 656336612;
var GENDER_PREF_ID = 1422490863;
var LANGUAGE_PREF_ID = 871501697;
var ARRIVAL_DATE_ID = 59244995;
var NOTES_ID = 632976728;
var NOTIFICATIONS_ID = 1305072126;

function dumpResponse(response, form) {
  var erasmus = {
    name: response.getResponseForItem(form.getItemById(NAME_ID)).getResponse(),
    surname: response.getResponseForItem(form.getItemById(SURNAME_ID)).getResponse(),
    gender: response.getResponseForItem(form.getItemById(GENDER_ID)).getResponse() == "Hombre / Male" ? true : false,
    birthdate: response.getResponseForItem(form.getItemById(BIRTHDATE_ID)).getResponse(),
    nationality_name: response.getResponseForItem(form.getItemById(NATIONALITY_ID)).getResponse(),
    email: response.getResponseForItem(form.getItemById(EMAIL_ID)).getResponse(),
    phone: response.getResponseForItem(form.getItemById(PHONE_ID)) != null ? response.getResponseForItem(form.getItemById(PHONE_ID)).getResponse() : null,
    studies_name: response.getResponseForItem(form.getItemById(STUDIES_ID)) != null ? response.getResponseForItem(form.getItemById(STUDIES_ID)).getResponse() : null,
    faculty_name: response.getResponseForItem(form.getItemById(FACULTY_ID)) != null ? response.getResponseForItem(form.getItemById(FACULTY_ID)).getResponse() : null,
    semester_id: CURRENT_SEMESTER_ID,
    register_date: Utilities.formatDate(response.getTimestamp(), 'GMT', 'yyyy-MM-dd HH:mm:ss'),
    gender_preference: response.getResponseForItem(form.getItemById(GENDER_PREF_ID)).getResponse() == "Hombre / Male" ? true : response.getResponseForItem(form.getItemById(GENDER_PREF_ID)).getResponse() == "Mujer / Female" ? false : null,
    language_preference: response.getResponseForItem(form.getItemById(LANGUAGE_PREF_ID)).getResponse() == "Español / Spanish" ? true : response.getResponseForItem(form.getItemById(LANGUAGE_PREF_ID)).getResponse() == "Inglés / English" ? false : null,
    arrival_date: response.getResponseForItem(form.getItemById(ARRIVAL_DATE_ID)).getResponse(),
    notes: response.getResponseForItem(form.getItemById(NOTES_ID)).getResponse(),
    notifications: response.getResponseForItem(form.getItemById(NOTIFICATIONS_ID)).getResponse() == "Sí / Yes" ? true : false
  };
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ erasmus: erasmus }),
    headers: {
      'Authorization': API_AUTH_TOKEN
    }
  };
  UrlFetchApp.fetch(API_SERVER + "/api/erasmuses", options);
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
