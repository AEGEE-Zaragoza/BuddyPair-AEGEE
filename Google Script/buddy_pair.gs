var CURRENT_SEMESTER_ID = 201701;

var API_SERVER = "https://buddypair.aegee-zaragoza.org";
var API_AUTH_TOKEN = "";

function getUnnotifiedErasmusInfo() {
  var options = {
    headers: {
      'Authorization': Utilities.base64Encode(API_AUTH_TOKEN, Utilities.Charset.UTF_8)
    }
  };
  var response = UrlFetchApp.fetch(API_SERVER + "/api/erasmuses/" + CURRENT_SEMESTER_ID + "/unnotified", options);
  return JSON.parse(response);
}

function getUnnotifiedPeersInfo() {
  var options = {
    headers: {
      'Authorization': Utilities.base64Encode(API_AUTH_TOKEN, Utilities.Charset.UTF_8)
    }
  };
  var response = UrlFetchApp.fetch(API_SERVER + "/api/peers/" + CURRENT_SEMESTER_ID + "/unnotified", options);
  return JSON.parse(response);
}

function notifyErasmus(unnotified) {
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
    try {
      GmailApp.sendEmail(recipient, SUBJECT, body, OPTIONS);
      notified.push(unnotified[i].erasmus_id);
    } catch (e) {
      // TODO: handle
      Logger.log(e);
    }
  }
  if(notified.length > 0) {
    var options = {
      method: 'PUT',
      headers: {
        'Authorization': Utilities.base64Encode(API_AUTH_TOKEN, Utilities.Charset.UTF_8)
      }
    };
    notified.forEach(function(id) {
      UrlFetchApp.fetch(API_SERVER + "/api/erasmus/" + id + "/notify", options);
    });
  }
}

function notifyPeers(unnotified) {
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
        "Nacionalidad: " + unnotified[i].erasmus_nationality + "\n" +
        "Facultad: " + unnotified[i].erasmus_faculty + "\n" +
        "Estudios: " + unnotified[i].erasmus_studies + "\n" +
        "Email: " + unnotified[i].erasmus_email + "\n";
      for(var j = i+1; j < unnotified.length; j++) {
        if(unnotified[j] != null && unnotified[j].peer_email == unnotified[i].peer_email) {
          body += 
            "\nNombre: " + unnotified[j].erasmus_name + " " + unnotified[j].erasmus_surname + "\n" +
            "Nacionalidad: " + unnotified[j].erasmus_nationality + "\n" +
            "Facultad: " + unnotified[j].erasmus_faculty + "\n" +
            "Estudios: " + unnotified[j].erasmus_studies + "\n" +
            "Email: " + unnotified[j].erasmus_email + "\n";
          unnotified[j] = null;
        }
      }
      body += BODY_PEER_EMAIL_FOOTER;
      try {
        GmailApp.sendEmail(recipient, SUBJECT, body, OPTIONS);
        notified.push(unnotified[i].peer_id);
      } catch (e) {
        // TODO: handle
        Logger.log(e);
      }
    }
  }
  if(notified.length > 0) {
    var options = {
      method: 'PUT',
      headers: {
        'Authorization': Utilities.base64Encode(API_AUTH_TOKEN, Utilities.Charset.UTF_8)
      }
    };
    notified.forEach(function(id) {
      UrlFetchApp.fetch(API_SERVER + "/api/peer/" + id + "/notify", options);
    });
  }
}

function notify() {
  var unnotified = getUnnotifiedErasmusInfo();
  notifyErasmus(unnotified);
  unnotified = getUnnotifiedPeersInfo();
  notifyPeers(unnotified);
}
