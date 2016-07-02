var HOST = "aegee-zaragoza.org";
var PORT = 3306;
var DB = "buddy_pair";
var USERNAME = "";
var PASSWORD = "";
var connection = Jdbc.getConnection("jdbc:mysql://" + HOST + ":" + PORT + "/" + DB, USERNAME, PASSWORD);

// TODO: implementar como aplicación web

function doGet() {
  // NOTA: el script solo se puede ejecutar por los usuarios que tengan permisos de 
  // lectura o edición sobre el fichero.
  // Se debe ejecutar con itaegee@gmail.com como propietario para poder mandar correos correctamente.
  return HtmlService.createTemplateFromFile("index").evaluate();
}

function getUnnotifiedErasmusInfo(conn) {
  var stmt = conn.prepareStatement(
    "select ERASMUS.id as erasmus_id, erasmus.email as erasmus_email, erasmus.name as erasmus_name, erasmus.surname as erasmus_surname, " +
        "peer.name as peer_name, peer.surname as peer_surname, peer.email as peer_email, STUDIES.name as peer_studies, " +
        "FACULTY.name as peer_faculty, PEER.notes as peer_notes " +
    "from ERASMUS " +
    "inner join STUDENT as erasmus on ERASMUS.erasmus = erasmus.id " +
    "inner join BUDDY_PAIR on ERASMUS.id = BUDDY_PAIR.erasmus " +
    "inner join PEER on BUDDY_PAIR.peer = PEER.id " +
    "inner join STUDENT as peer on PEER.peer = peer.id " +
    "left join STUDIES on peer.studies = STUDIES.id " +
    "left join FACULTY on peer.faculty = FACULTY.id " +
    "where not BUDDY_PAIR.notified_erasmus");
  var rs = stmt.executeQuery();
  var res = [];
  var i = 0;
  while(rs.next()) {
    var info_erasmus = {
      erasmus_id: rs.getInt("erasmus_id"),
      erasmus_email: rs.getString("erasmus_email"),
      erasmus_name: rs.getString("erasmus_name"),
      erasmus_surname: rs.getString("erasmus_surname"),
      peer_name: rs.getString("peer_name"),
      peer_surname: rs.getString("peer_surname"),
      peer_email: rs.getString("peer_email"),
      peer_studies: rs.getString("peer_studies") != null ? rs.getString("peer_studies") : "-",
      peer_faculty: rs.getString("peer_faculty") != null ? rs.getString("peer_faculty") : "-",
      peer_notes: rs.getString("peer_notes") != null ? rs.getString("peer_notes") : "_"
    };
    res[i++] = info_erasmus;
  }
  rs.close();
  stmt.close();
  return res;
}

function getUnnotifiedPeersInfo(conn) {
  var stmt = conn.prepareStatement(
    "select PEER.id as peer_id, peer.email as peer_email, peer.name as peer_name, peer.surname as peer_surname, " +
      "erasmus.name as erasmus_name, erasmus.surname as erasmus_surname, COUNTRY.country_name as erasmus_nacionality, " +
      "erasmus.email as erasmus_email, STUDIES.name as erasmus_studies, FACULTY.name as erasmus_faculty, " +
      "ERASMUS.arrival_date as erasmus_arrival_date, ERASMUS.notes as erasmus_notes " +
    "from PEER " +
    "inner join STUDENT as peer on PEER.peer = peer.id " +
    "inner join BUDDY_PAIR on PEER.id = BUDDY_PAIR.peer " +
    "inner join ERASMUS on BUDDY_PAIR.erasmus = ERASMUS.id " +
    "inner join STUDENT as erasmus on ERASMUS.erasmus = erasmus.id " +
    "inner join COUNTRY on erasmus.nacionality = COUNTRY.country_code " +
    "left join STUDIES on erasmus.studies = STUDIES.id " +
    "left join FACULTY on erasmus.faculty = FACULTY.id " +
    "where not BUDDY_PAIR.notified_peer");
  var rs = stmt.executeQuery();
  var res = [];
  var i = 0;
  while(rs.next()) {
    // NOTA: para tutores que tengan > 1 Erasmus asignados, se devuelven en varias
    // entradas del array y hay que gestionarlo más adelante manualmente
    var info_peer = {
      peer_id: rs.getInt("peer_id"),
      peer_email: rs.getString("peer_email"),
      peer_name: rs.getString("peer_name"),
      peer_surname: rs.getString("peer_surname"),
      erasmus_name: rs.getString("erasmus_name"),
      erasmus_surname: rs.getString("erasmus_surname"),
      erasmus_nacionality: rs.getString("erasmus_nacionality"),
      erasmus_email: rs.getString("erasmus_email"),
      erasmus_studies: rs.getString("erasmus_studies") != null ? rs.getString("erasmus_studies") : "-",
      erasmus_faculty: rs.getString("erasmus_faculty") != null ? rs.getString("erasmus_faculty") : "-",
      erasmus_arrival_date: rs.getTime("erasmus_arrival_date") != null ? rs.getTime("erasmus_arrival_date") : "-",
      erasmus_notes: rs.getString("erasmus_notes") != null ? rs.getString("erasmus_notes") : "-"
    };
    res[i++] = info_peer;
  }
  rs.close();
  stmt.close();
  return res;
}

function notifyErasmus(conn, unnotified) {
  var SUBJECT = "AEGEE-Zaragoza - Buddy Pair";
  var OPTIONS = {
    from: "erasmus@aegee-zaragoza.org",
    replyTo: "erasmus@aegee-zaragoza.org"
  };
  var notified = [];
  for(var i = 0; i < unnotified.length; i++) {
    var recipient = unnotified[i].erasmus_email;
    var body = "ENGLISH VERSION BELOW\n\n" +
      "Se te ha asignado el siguiente tutor:\n" +
      "Nombre: " + unnotified[i].peer_name + " " + unnotified[i].peer_surname + "\n" +
      "Facultad: " + unnotified[i].peer_faculty + "\n" +
      "Estudios: " + unnotified[i].peer_studies + "\n" +
      "Email: " + unnotified[i].peer_email + "\n" +
      "Te puede ayudar a conocer la ciudad y en aspectos relacionados con la universidad:\n" +
      "- Acompañándote cuando llegues a la ciudad\n" +
      "- Ayudándote a encontrar un apartamento\n" +
      "- Aconsejándote y orientándote sobre la universidad\n" +
      "- ...\n\n" +
      "----------------------------------------------------------\nENGLISH VERSION:\n" +
      "You have been assigned the following peer student:\n" +
      "Name: " + unnotified[i].peer_name + unnotified[i].peer_surname + "\n" +
      "Faculty: " + unnotified[i].peer_faculty + "\n" +
      "Studies: " + unnotified[i].peer_studies + "\n" +
      "Email: " + unnotified[i].peer_email + "\n" +
      "He/she can help you get to know your way around the city and the University:\n" +
      "- Meeting you at your arrival\n" +
      "- Helping you find a flat\n" +
      "- Providing orientation and advice on universty life\n" +
      "- ...\n" +
      "\nErasmus Team - AEGEE-Zaragoza\n" +
      "C/Corona de Aragón 42 (Casa del Estudiante)\n" +
      "Email: erasmus@aegee-zaragoza.org";
    GmailApp.sendEmail(recipient, SUBJECT, body, OPTIONS);
    notified.push(unnotified[i].erasmus_id);
  }
  if(notified.length > 0) {
    var sql = "update BUDDY_PAIR set notified_erasmus = true where ";
    for(var i = 0; i < notified.length; i++) {
      sql += i < notified.length-1 ? "erasmus = " + notified[i] + " or " : "erasmus = " + notified[i];
    }
    var stmt = conn.prepareStatement(sql);
    stmt.executeUpdate();
    stmt.close();
  }
}

function notifyPeers(conn, unnotified) {
  var SUBJECT = "AEGEE-Zaragoza - Buddy Pair";
  var BODY_PEER_EMAIL_HEADER = 
      "Se te han asignado los siguientes estudiantes Erasmus:\n";
  var BODY_PEER_EMAIL_FOOTER = 
      "\nBásicamente lo que tienes que hacer es:\n" +
      "- Contactar por correo electrónico previamente a la llegada del estudiante.\n" +
      "- Recibir al estudiante en el momento de su llegada y acompañarlo a su alojamiento.\n" +
      "- Facilitarle la información básica sobre transporte público en la ciudad (Zaragoza, Huesca, Teruel, etc...), apertura de una cuenta bancaria, etc.\n" +
      "- Si va a buscar piso, echarle una mano a la hora de ponerse en contacto con los propietarios y, en su caso, acompañarlo a hacer las correspondientes visitas.\n" +
      "- Acompañarlo a la oficina de Relaciones Internacionales de su facultad el día y a la hora en el que se le haya citado para las gestiones de inscripción.\n" +
      "- Mostrarle los servicios de la Universidad como: reprografía, salas de estudio y biblioteca, salas de usuarios, cafeterías, comedores... O darle un paseo general por ésta, para que conozca el/los CAMPUS.\n" +
      "- Ayudarlo a interpretar los horarios de las clases de la UZ\n" +
      "- Si prevé realizar uno de los cursos de español para extranjeros de la UZ, ayudarlo en las gestiones de inscripción en los mismos.\n" +
      "- Informarle de la existencia en la Universidad de asociaciones de estudiantes que organizan actividades con el objeto específico de ayudarles a integrarse y conocer la ciudad/el país.\n" +
      "- Aquellas otras acciones que tu buen criterio te indique\n" +
      "\nErasmus Team - AEGEE-Zaragoza\n" +
      "C/Corona de Aragón 42 (Casa del Estudiante)\n" +
      "Email: erasmus@aegee-zaragoza.org";
  var OPTIONS = {
    from: "erasmus@aegee-zaragoza.org",
    replyTo: "erasmus@aegee-zaragoza.org"
  };
  var notified = [];
  for(var i = 0; i < unnotified.length; i++) {
    if(unnotified[i] != null) {
      var recipient = unnotified[i].peer_email;
      var body = BODY_PEER_EMAIL_HEADER;
      body += 
        "\nNombre: " + unnotified[i].erasmus_name + " " + unnotified[i].erasmus_surname + "\n" +
        "Nacionalidad: " + unnotified[i].erasmus_nacionality + "\n" +
        "Facultad: " + unnotified[i].erasmus_faculty + "\n" +
        "Estudios: " + unnotified[i].erasmus_studies + "\n" +
        "Email: " + unnotified[i].erasmus_email + "\n";
      for(var j = i+1; j < unnotified.length; j++) {
        if(unnotified[j] != null && unnotified[j].peer_email == unnotified[i].peer_email) {
          body += 
            "\nNombre: " + unnotified[i].erasmus_name + " " + unnotified[i].erasmus_surname + "\n" +
            "Nacionalidad: " + unnotified[i].erasmus_nacionality + "\n" +
            "Facultad: " + unnotified[i].erasmus_faculty + "\n" +
            "Estudios: " + unnotified[i].erasmus_studies + "\n" +
            "Email: " + unnotified[i].erasmus_email + "\n";
          unnotified[j] = null;
        }
      }
      body += BODY_PEER_EMAIL_FOOTER;
      GmailApp.sendEmail(recipient, SUBJECT, body, OPTIONS);
      notified.push(unnotified[i].peer_id);
    }
  }
  if(notified.length > 0) {
    var sql = "update BUDDY_PAIR set notified_peer = true where ";
    for(var i = 0; i < notified.length; i++) {
      sql += i < notified.length-1 ? "peer = " + notified[i] + " or " : "peer = " + notified[i];
    }
    var stmt = conn.prepareStatement(sql);
    stmt.executeUpdate();
    stmt.close();
  }
}

function emparejar() {
  var unnotified = getUnnotifiedErasmusInfo(connection);
  notifyErasmus(connection, unnotified);
  unnotified = getUnnotifiedPeersInfo(connection);
  notifyPeers(connection, unnotified);
}
