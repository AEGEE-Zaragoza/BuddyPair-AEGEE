var HOST = "aegee-zaragoza.org";
var PORT = 3306;
var DB = "buddy_pair";
var USERNAME = "";
var PASSWORD = "";
var connection = Jdbc.getConnection("jdbc:mysql://" + HOST + ":" + PORT + "/" + DB, USERNAME, PASSWORD);

var FORM_ID = "11VV66EK6g58QlvSo2XWsKCGXhIaYzBrp0CCiTMjf0qI";
var NAME_ID = 892406596;
var SURNAME_ID = 768667300;
var GENDER_ID = 376942644;
var BIRTHDATE_ID = 2016505349;
var NACIONALITY_ID = 25701897;
var EMAIL_ID = 442663492;
var PHONE_ID = 2043992663;
var STUDIES_ID = 640072015;
var FACULTY_ID = 128135018;
var GENDER_PREF_ID = 1905357830;
var ARRIVAL_DATE_ID = 1705276113;
var NOTES_ID = 1589299646;

function onOpen() {
  FormApp.getUi()
      .createMenu('Base de datos')
      .addItem('Volcar respuestas', 'dumpResponses')
      .addToUi();
}

function getItemsIds() {
  var form = FormApp.openById(FORM_ID);
  var items = form.getItems();
  for(var i = 0; i < items.length; i++) {
    Logger.log("%s - %s", items[i].getId(), items[i].getTitle());
  }
}

function populateFields() {
  //var form = FormApp.getActiveForm();
  var form = FormApp.openById(FORM_ID);
  form.getItemById(NACIONALITY_ID).asListItem().setChoiceValues(getCountries(connection));
  form.getItemById(FACULTY_ID).asListItem().setChoiceValues(getStudies(connection));
  form.getItemById(STUDIES_ID).asListItem().setChoiceValues(getFaculties(connection));
}

function getCountries(conn) {
  var stmt = conn.prepareStatement("select country_name from COUNTRY");
  var rs = stmt.executeQuery();
  var res = [];
  var i = 0;
  while(rs.next()) {
    res[i++] = rs.getString("country_name");
  }
  rs.close();
  stmt.close();
  return res;
}

function getStudies(conn) {
  var stmt = conn.prepareStatement("select name from STUDIES");
  var rs = stmt.executeQuery();
  var res = [];
  var i = 0;
  while(rs.next()) {
    res[i++] = rs.getString("name");
  }
  rs.close();
  stmt.close();
  return res;
}

function getFaculties(conn) {
  var stmt = conn.prepareStatement("select name from FACULTY");
  var rs = stmt.executeQuery();
  var res = [];
  var i = 0;
  while(rs.next()) {
    res[i++] = rs.getString("name");
  }
  rs.close();
  stmt.close();
  return res;
}

function insertStudent(conn, student) {
  var stmt = conn.prepareStatement(
    "insert into STUDENT (name, surname, gender, birthdate, nacionality, email, phone, studies, faculty) " + 
    "values (?, ?, ?, ?, (select country_code from COUNTRY where country_name = ?), ?, ?, (select id from STUDIES where name = ?), (select id from FACULTY where name = ?))", 1);
  stmt.setString(1, student.name);
  stmt.setString(2, student.surname);
  stmt.setBoolean(3, student.gender == "Hombre / Male");
  stmt.setDate(4, Jdbc.parseDate(student.birthdate));
  stmt.setString(5, student.nacionality);
  stmt.setString(6, student.email);
  stmt.setString(7, student.phone);
  stmt.setString(8, student.studies);
  stmt.setString(9, student.faculty);
  try {
    stmt.executeUpdate();
    var rs = stmt.getGeneratedKeys();
  } catch(e) {
    stmt.close();
    stmt = conn.prepareStatement("select id from STUDENT where email = ?");
    stmt.setString(1, student.email);
    var rs = stmt.executeQuery();
  }
  var id = -1;
  if(rs.next()) {
    id = rs.getInt(1);
  }
  rs.close();
  stmt.close();
  return id;
}

function insertErasmus(conn, erasmus) {
  var stmt = conn.prepareStatement(
    "insert into ERASMUS (register_date, erasmus, gender_preference, arrival_date, notes) " + 
    "values (?, ?, ?, ?, ?)", 1);
  stmt.setTimestamp(1, Jdbc.newTimestamp(erasmus.register_date.getTime()));
  stmt.setInt(2, erasmus.erasmus);
  if(erasmus.gender_preference == "Sin preferencia / No preferences") {
    stmt.setNull(3, 0);
  } else {
    stmt.setBoolean(3, erasmus.gender_preference == "Hombre / Male");
  }
  // TODO: usar JdbcTime
  if (erasmus.arrival_date.equals("0000-00-00 00:00:00") || erasmus.arrival_date.equals("")) {
      stmt.setNull(4, 0);
  } else {
      stmt.setString(4, erasmus.arrival_date);
  }
  stmt.setString(5, erasmus.notes);
  try {
    stmt.executeUpdate();
    var rs = stmt.getGeneratedKeys();
  } catch(e) {
    stmt.close();
    stmt = conn.prepareStatement("select id from ERASMUS where erasmus = ?");
    stmt.setInt(1, erasmus.erasmus);
    var rs = stmt.executeQuery();
  }
  var id = -1;
  if(rs.next()) {
    id = rs.getInt(1);
  }
  rs.close();
  stmt.close();
  return id;
}

function dumpResponses() {
  var form = FormApp.getActiveForm();
  var responses = form.getResponses();
  for(var i = 0; i < responses.length; i++) {
    dumpResponse(responses[i], form);
  }
}

function onFormSubmit(e) {
  dumpResponse(e.response, e.source);
}
  
function dumpResponse(response, form) {
  var student = {
    name: response.getResponseForItem(form.getItemById(NAME_ID)).getResponse(),
    surname: response.getResponseForItem(form.getItemById(SURNAME_ID)).getResponse(),
    gender: response.getResponseForItem(form.getItemById(GENDER_ID)).getResponse(),
    birthdate: response.getResponseForItem(form.getItemById(BIRTHDATE_ID)).getResponse(),
    nacionality: response.getResponseForItem(form.getItemById(NACIONALITY_ID)).getResponse(),
    email: response.getResponseForItem(form.getItemById(EMAIL_ID)).getResponse(),
    phone: response.getResponseForItem(form.getItemById(PHONE_ID)) != null ? response.getResponseForItem(form.getItemById(PHONE_ID)).getResponse() : null,
    studies: response.getResponseForItem(form.getItemById(STUDIES_ID)) != null ? response.getResponseForItem(form.getItemById(STUDIES_ID)).getResponse() : null,
    faculty: response.getResponseForItem(form.getItemById(FACULTY_ID)) != null ? response.getResponseForItem(form.getItemById(FACULTY_ID)).getResponse() : null
  };
  var student_nr = insertStudent(connection, student);
  var erasmus = {
    register_date: response.getTimestamp(),
    erasmus: student_nr,
    gender_preference: response.getResponseForItem(form.getItemById(GENDER_PREF_ID)).getResponse(),
    arrival_date: response.getResponseForItem(form.getItemById(ARRIVAL_DATE_ID)).getResponse(),
    notes: response.getResponseForItem(form.getItemById(NOTES_ID)).getResponse()
  };
  var erasmus_nr = insertErasmus(connection, erasmus);
  Logger.log("Erasmus with id=" + erasmus_nr + " inserted correctly");
}
