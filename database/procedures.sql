DROP PROCEDURE IF EXISTS emparejar_estudiantes;
DROP PROCEDURE IF EXISTS emparejar;

DELIMITER $$
CREATE PROCEDURE emparejar_estudiantes(IN erasmus INT, IN peer INT) BEGIN
    INSERT INTO BUDDY_PAIR(erasmus, peer) VALUES (erasmus, peer);
END $$

-- Procedimiento que empareja todos los estudiantes Erasmus posibles con sus respectivos tutores.
-- El criterio para realizar los emparejamientos se basa está basado en un sistema de pesos con los siguientes valores:
-- * Mismos estudios                                 2 puntos
-- * Misma facultad                                  1 punto
-- * Diferente facultad                             -1 punto
-- * Género preferido / sin preferencia de género    1 punto (Erasmus + tutor)
-- * Diferente idioma (español o inglés)            -2 puntos
-- * Nacionalidad preferida / sin preferencia        1 punto
-- * Miembro de AEGEE                                1 punto
-- Se da preferencia después de aplicar estos criterios a los estudiantes que se hayan apuntado antes.
-- Se da preferencia antes de aplicar estos criterios a los tutores que menos estudiantes Erasmus asignados tienen
CREATE PROCEDURE emparejar() BEGIN
    DECLARE _done_erasmus, _done_peers BOOLEAN DEFAULT FALSE;
    DECLARE _erasmus_id, _erasmus_student_id, _erasmus_studies, _erasmus_faculty INT;
    DECLARE _erasmus_gender_preference, _erasmus_gender, _erasmus_language_preference BOOLEAN;
    DECLARE _erasmus_nationality VARCHAR(2);
    DECLARE _peer_id, _peer_erasmus_limit, _peer_erasmus_asignados, _peer_student_id, _peer_studies, _peer_faculty INT;
    DECLARE _peer_gender_preference, _peer_aegee_member, _peer_gender, _peer_speaks_english BOOLEAN;
    DECLARE _peer_nationality_preference VARCHAR(2);
    DECLARE _mejor_peer_id, _max_peso INT;
    DECLARE _cur_erasmus CURSOR FOR 
        SELECT ERASMUS.id, ERASMUS.gender_preference, ERASMUS.language_preference, STUDENT.id, STUDENT.gender, STUDENT.nationality, STUDENT.studies, STUDENT.faculty
        FROM ERASMUS 
        INNER JOIN STUDENT 
        ON ERASMUS.erasmus = STUDENT.id 
        WHERE NOT EXISTS (
            SELECT * 
            FROM BUDDY_PAIR 
            WHERE erasmus = ERASMUS.id) 
        ORDER BY register_date ASC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET _done_erasmus := TRUE;

    DROP TABLE IF EXISTS PESOS;
    CREATE TEMPORARY TABLE PESOS(peso INT DEFAULT 0) 
        SELECT id AS peer_id, (SELECT COUNT(*) FROM BUDDY_PAIR WHERE peer = peer_id) AS erasmus_asignados FROM PEER WHERE (
            SELECT COUNT(*) 
            FROM BUDDY_PAIR 
            WHERE peer = PEER.id) < PEER.erasmus_limit;
    OPEN _cur_erasmus;
    erasmus_loop: LOOP
        FETCH _cur_erasmus INTO _erasmus_id, _erasmus_gender_preference, _erasmus_language_preference, _erasmus_student_id, _erasmus_gender, _erasmus_nationality, _erasmus_studies, _erasmus_faculty;
        IF _done_erasmus THEN
            CLOSE _cur_erasmus;
            LEAVE erasmus_loop;
        END IF;
        BLOQUE2: BEGIN
            DECLARE _min_erasmus_asignados INT;
            DECLARE _cur_peers CURSOR FOR
                SELECT PEER.id AS peer_id, PEER.gender_preference, PEER.speaks_english, PEER.nationality_preference, PEER.aegee_member, PEER.erasmus_limit, STUDENT.id, STUDENT.gender, STUDENT.studies, STUDENT.faculty 
                FROM PESOS
                INNER JOIN PEER 
                ON PESOS.peer_id = PEER.id
                INNER JOIN STUDENT 
                ON PEER.peer = STUDENT.id 
                WHERE PESOS.erasmus_asignados = _min_erasmus_asignados AND PESOS.erasmus_asignados < PEER.erasmus_limit
                ORDER BY PEER.register_date ASC;
            DECLARE CONTINUE HANDLER FOR NOT FOUND SET _done_peers := TRUE;

            SELECT MIN(erasmus_asignados) INTO _min_erasmus_asignados FROM PESOS;
            OPEN _cur_peers;
            peers_loop: LOOP
                FETCH _cur_peers INTO _peer_id, _peer_gender_preference, _peer_speaks_english, _peer_nationality_preference, _peer_aegee_member, _peer_erasmus_limit, _peer_student_id, _peer_gender, _peer_studies, _peer_faculty;
                IF _done_peers THEN
                    SET _done_erasmus := FALSE;
                    SET _done_peers := FALSE;
                    CLOSE _cur_peers;
                    LEAVE peers_loop;
                END IF;
                -- Mismos estudios -> +2
                IF (_erasmus_studies IS NOT NULL) AND (_peer_studies IS NOT NULL) AND (_erasmus_studies = _peer_studies) THEN
                    UPDATE PESOS SET peso = peso + 2 WHERE peer_id = _peer_id;
                END IF;
                -- Misma facultad -> +1; diferente facultad -> -1
                IF (_erasmus_faculty IS NOT NULL) AND (_peer_faculty IS NOT NULL) AND (_erasmus_faculty = _peer_faculty) THEN
                    UPDATE PESOS SET peso = peso + 1 WHERE peer_id = _peer_id;
                ELSE
                    UPDATE PESOS SET peso = peso - 1 WHERE peer_id = _peer_id;
                END IF;
                -- Erasmus sin preferencia de género / misma preferencia que tutor -> +1
                IF (_erasmus_gender_preference IS NULL) OR (_erasmus_gender_preference = _peer_gender_preference) THEN
                    UPDATE PESOS SET peso = peso + 1 WHERE peer_id = _peer_id;
                END IF;
                -- Tutor sin preferencia de género / misma preferencia que Erasmus -> +1
                IF (_peer_gender_preference IS NULL) OR (_peer_gender_preference = _erasmus_gender_preference) THEN
                    UPDATE PESOS SET peso = peso + 1 WHERE peer_id = _peer_id;
                END IF;
                -- Erasmus prefiere inglés pero tutor no habla inglés -> -2
                IF (_erasmus_language_preference IS NOT NULL) AND (NOT _erasmus_language_preference AND NOT _peer_speaks_english) THEN
                    UPDATE PESOS SET peso = peso - 2 WHERE peer_id = _peer_id;
                END IF;
                -- Nacionalidad preferida / sin preferencia
                IF (_peer_nationality_preference IS NULL) OR (_peer_nationality_preference = _erasmus_nationality) THEN
                    UPDATE PESOS SET peso = peso + 1 WHERE peer_id = _peer_id;
                END IF;
                -- Miembro de AEGEE
                IF (_peer_aegee_member) THEN
                    UPDATE PESOS SET peso = peso + 1 WHERE peer_id = _peer_id;
                END IF;
            END LOOP peers_loop;
        END BLOQUE2;
        SELECT MAX(peso) INTO _max_peso FROM PESOS;
        SELECT peer_id INTO _mejor_peer_id FROM PESOS WHERE peso = _max_peso LIMIT 1;
        CALL emparejar_estudiantes(_erasmus_id, _mejor_peer_id);
        UPDATE PESOS SET erasmus_asignados = erasmus_asignados + 1 WHERE peer_id = _mejor_peer_id;
        UPDATE PESOS SET peso = 0;
    END LOOP erasmus_loop;
    DROP TABLE PESOS;
END $$
DELIMITER ;
