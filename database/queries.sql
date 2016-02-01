-- Número de tutores disponibles
select count(*) as tutores_disponibles 
from PEER 
where (
	select count(*) 
	from BUDDY_PAIR 
	where peer = PEER.id) < PEER.erasmus_limit;

-- Número de tutores sin ningún Erasmus asignado
select count(*) as tutores_sin_erasmus 
from PEER 
where not exists (
	select * 
	from BUDDY_PAIR 
	where peer = PEER.id);

-- Información de todos los tutores sin ningún Erasmus asignado
select PEER.id as peer_id, PEER.register_date, STUDENT.*
from PEER
inner join STUDENT
on PEER.peer = STUDENT.id
where not exists (
	select * 
	from BUDDY_PAIR 
	where peer = PEER.id);

-- Número de tutores con más de un erasmus asignado
select count(*) as tutores_con_mas_de_un_erasmus
from PEER
where (
	select count(*) 
	from BUDDY_PAIR 
	where peer = PEER.id) > 1;

-- Número de Erasmus sin ningún tutor asignado
select count(*) as erasmus_sin_tutor 
from ERASMUS 
where not exists (
	select * 
	from BUDDY_PAIR 
	where erasmus = ERASMUS.id);

-- Información de todos los Erasmus sin ningún tutor asignado
select ERASMUS.id as erasmus_id, ERASMUS.register_date, STUDENT.*
from ERASMUS
inner join STUDENT
on ERASMUS.erasmus = STUDENT.id
where not exists (
	select * 
	from BUDDY_PAIR 
	where erasmus = ERASMUS.id);

-- Número de huecos disponibles
select sum(PEER.erasmus_limit-(select count(*) from BUDDY_PAIR where peer = PEER.id)) as huecos_disponibles 
from PEER 
where (
	select count(*) 
	from BUDDY_PAIR 
	where peer = PEER.id) < PEER.erasmus_limit;

-- Información del tutor asignado a todos los Erasmus sin notificar
select ERASMUS.id as erasmus_id, erasmus.email as erasmus_email, erasmus.name as erasmus_name, erasmus.surname as erasmus_surname, 
	peer.name as peer_name, peer.surname as peer_surname, peer.email as peer_email, STUDIES.name as peer_studies, 
	FACULTY.name as peer_faculty 
from ERASMUS 
inner join STUDENT as erasmus 
on ERASMUS.erasmus = erasmus.id 
inner join BUDDY_PAIR 
on ERASMUS.id = BUDDY_PAIR.erasmus 
inner join PEER 
on BUDDY_PAIR.peer = PEER.id 
inner join STUDENT as peer 
on PEER.peer = peer.id 
left join STUDIES 
on peer.studies = STUDIES.id 
left join FACULTY 
on peer.faculty = FACULTY.id 
where not BUDDY_PAIR.notified_erasmus;

-- Información de todos los Erasmus asignados a todos los tutores sin notificar
select PEER.id as peer_id, peer.email as peer_email, peer.name as peer_name, peer.surname as peer_surname, erasmus.name as erasmus_name, 
	erasmus.surname as erasmus_surname, erasmus.email as erasmus_email, STUDIES.name as erasmus_studies, 
	FACULTY.name as erasmus_faculty, ERASMUS.arrival_date as erasmus_arrival_date 
from PEER 
inner join STUDENT as peer 
on PEER.peer = peer.id 
inner join BUDDY_PAIR 
on PEER.id = BUDDY_PAIR.peer 
inner join ERASMUS 
on BUDDY_PAIR.erasmus = ERASMUS.id 
inner join STUDENT as erasmus 
on ERASMUS.erasmus = erasmus.id 
left join STUDIES 
on erasmus.studies = STUDIES.id 
left join FACULTY 
on erasmus.faculty = FACULTY.id 
where not BUDDY_PAIR.notified_peer;

-- Información de todos los tutores que no son de España
select PEER.id as peer_id, PEER.register_date, STUDENT.* 
from PEER
inner join STUDENT
on PEER.peer = STUDENT.id
where STUDENT.nacionality != 'ES';

-- Información de todos los tutores que no son de España a los que se les ha asignado un Erasmus
select PEER.id as peer_id, PEER.register_date, STUDENT.* 
from PEER
inner join STUDENT
on PEER.peer = STUDENT.id
inner join BUDDY_PAIR
on PEER.peer = BUDDY_PAIR.peer
where STUDENT.nacionality != 'ES';

-- Información de todos los estudiantes registrados como tutores y Erasmus
select PEER.id as peer_id, ERASMUS.id as erasmus_id, STUDENT.* 
from STUDENT
inner join PEER
on STUDENT.id = PEER.peer
inner join ERASMUS
on STUDENT.id = ERASMUS.erasmus;

-- Información de todos los tutores a los que se les ha asignado algún Erasmus (últil para enviar a RRII)
select STUDENT.name as name, STUDENT.surname as surname, STUDENT.email as email
from STUDENT
inner join PEER
on STUDENT.id = PEER.peer
inner join BUDDY_PAIR
on PEER.id = BUDDY_PAIR.peer
group by name, surname, email;
