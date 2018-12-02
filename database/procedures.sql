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
CREATE PROCEDURE emparejar(IN _semester_id INT) BEGIN
    DECLARE _done_erasmus, _done_peers BOOLEAN DEFAULT FALSE;
    DECLARE _erasmus_id, _erasmus_student_id, _erasmus_studies, _erasmus_faculty INT;
    DECLARE _erasmus_gender_preference, _erasmus_gender, _erasmus_language_preference BOOLEAN;
    DECLARE _erasmus_nationality VARCHAR(2);
    DECLARE _peer_id, _peer_erasmus_limit, _peer_student_id, _peer_studies, _peer_faculty INT;
    DECLARE _peer_gender_preference, _peer_aegee_member, _peer_gender, _peer_speaks_english BOOLEAN;
    DECLARE _peer_nationality_preference VARCHAR(2);
    DECLARE _best_peer_id, _best_rank INT;
    -- Erasmus without a peer
    DECLARE _cur_unmatched_erasmus CURSOR FOR
        SELECT ERASMUS.id, ERASMUS.gender_preference, ERASMUS.language_preference, STUDENT.id, STUDENT.gender, STUDENT.nationality, STUDENT.studies, STUDENT.faculty
        FROM ERASMUS
          INNER JOIN STUDENT ON ERASMUS.erasmus = STUDENT.id
        LEFT JOIN BUDDY_PAIR ON ERASMUS.id = BUDDY_PAIR.erasmus
        WHERE BUDDY_PAIR.erasmus IS NULL AND semester_id = _semester_id
        ORDER BY register_date ASC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET _done_erasmus := TRUE;

    DROP TABLE IF EXISTS RANKS;
    CREATE TEMPORARY TABLE RANKS (
        rank INT DEFAULT 0)
        SELECT PEER.id AS peer_id, COUNT(BUDDY_PAIR.peer) AS assigned_erasmus
        FROM PEER
          LEFT JOIN BUDDY_PAIR ON PEER.id = BUDDY_PAIR.peer
        WHERE PEER.semester_id = _semester_id
        GROUP BY PEER.id, PEER.erasmus_limit
        HAVING COUNT(BUDDY_PAIR.peer) < PEER.erasmus_limit;
    OPEN _cur_unmatched_erasmus;
    erasmus_loop: LOOP
        FETCH _cur_unmatched_erasmus INTO _erasmus_id, _erasmus_gender_preference, _erasmus_language_preference, _erasmus_student_id, _erasmus_gender, _erasmus_nationality, _erasmus_studies, _erasmus_faculty;
        IF _done_erasmus THEN
            CLOSE _cur_unmatched_erasmus;
            LEAVE erasmus_loop;
        END IF;
        block2: BEGIN
            DECLARE _min_assigned_erasmus INT;
            DECLARE _cur_assignable_peers CURSOR FOR
                SELECT PEER.id AS peer_id, PEER.gender_preference, PEER.speaks_english, PEER.nationality_preference, PEER.aegee_member, PEER.erasmus_limit, STUDENT.id, STUDENT.gender, STUDENT.studies, STUDENT.faculty
                FROM RANKS
                  INNER JOIN PEER ON RANKS.peer_id = PEER.id
                  INNER JOIN STUDENT ON PEER.peer = STUDENT.id
                WHERE RANKS.assigned_erasmus = _min_assigned_erasmus
                      AND RANKS.assigned_erasmus < PEER.erasmus_limit
                ORDER BY PEER.register_date ASC;
            DECLARE CONTINUE HANDLER FOR NOT FOUND SET _done_peers := TRUE;

            SELECT MIN(assigned_erasmus) INTO _min_assigned_erasmus FROM RANKS;
            OPEN _cur_assignable_peers;
            peers_loop: LOOP
                FETCH _cur_assignable_peers INTO _peer_id, _peer_gender_preference, _peer_speaks_english, _peer_nationality_preference, _peer_aegee_member, _peer_erasmus_limit, _peer_student_id, _peer_gender, _peer_studies, _peer_faculty;
                IF _done_peers THEN
                    SET _done_erasmus := FALSE;
                    SET _done_peers := FALSE;
                    CLOSE _cur_assignable_peers;
                    LEAVE peers_loop;
                END IF;
                -- Same studies -> +2
                IF (_erasmus_studies IS NOT NULL) AND (_peer_studies IS NOT NULL) AND (_erasmus_studies = _peer_studies) THEN
                    UPDATE RANKS SET rank = rank + 2 WHERE peer_id = _peer_id;
                END IF;
                -- Same faculty -> +1; different faculty -> -1
                IF (_erasmus_faculty IS NOT NULL) AND (_peer_faculty IS NOT NULL) AND (_erasmus_faculty = _peer_faculty) THEN
                    UPDATE RANKS SET rank = rank + 1 WHERE peer_id = _peer_id;
                ELSE
                    UPDATE RANKS SET rank = rank - 1 WHERE peer_id = _peer_id;
                END IF;
                -- Erasmus without gender preference / same preference as peer -> +1
                IF (_erasmus_gender_preference IS NULL) OR (_erasmus_gender_preference = _peer_gender_preference) THEN
                    UPDATE RANKS SET rank = rank + 1 WHERE peer_id = _peer_id;
                END IF;
                -- Peer without gender preference / same preference as Erasmus -> +1
                IF (_peer_gender_preference IS NULL) OR (_peer_gender_preference = _erasmus_gender_preference) THEN
                    UPDATE RANKS SET rank = rank + 1 WHERE peer_id = _peer_id;
                END IF;
                -- Erasmus prefers English but peer doesn't speak it -> -2
                IF (_erasmus_language_preference IS NOT NULL) AND (NOT _erasmus_language_preference AND NOT _peer_speaks_english) THEN
                    UPDATE RANKS SET rank = rank - 2 WHERE peer_id = _peer_id;
                END IF;
                -- Preferred nationality / no preference
                IF (_peer_nationality_preference IS NULL) OR (_peer_nationality_preference = _erasmus_nationality) THEN
                    UPDATE RANKS SET rank = rank + 1 WHERE peer_id = _peer_id;
                END IF;
                -- AEGEE member
                IF (_peer_aegee_member) THEN
                    UPDATE RANKS SET rank = rank + 1 WHERE peer_id = _peer_id;
                END IF;
            END LOOP peers_loop;
        END block2;
        SELECT MAX(rank)
        INTO _best_rank
        FROM RANKS
          INNER JOIN PEER ON RANKS.peer_id = PEER.id
        WHERE RANKS.assigned_erasmus < PEER.erasmus_limit;
        IF (_best_rank IS NOT NULL) THEN
          SELECT RANKS.peer_id
          INTO _best_peer_id
          FROM RANKS
            INNER JOIN PEER ON RANKS.peer_id = PEER.id
          WHERE RANKS.rank = _best_rank AND RANKS.assigned_erasmus < PEER.erasmus_limit
          LIMIT 1;
          CALL emparejar_estudiantes(_erasmus_id, _best_peer_id);
          UPDATE RANKS SET assigned_erasmus = assigned_erasmus + 1 WHERE peer_id = _best_peer_id;
        END IF;
        UPDATE RANKS SET rank = 0;
    END LOOP erasmus_loop;
    DROP TABLE RANKS;
END $$
DELIMITER ;
