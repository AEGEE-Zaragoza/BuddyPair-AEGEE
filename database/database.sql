drop table if exists BUDDY_PAIR;
drop table if exists PEER;
drop table if exists ERASMUS;
drop table if exists STUDENT;
drop table if exists FACULTY;
drop table if exists STUDIES;
drop table if exists COUNTRY;
drop table if exists SEMESTER;

create table COUNTRY (
    country_code varchar(2) primary key,
    country_name varchar(125) unique not null
);

create table STUDIES (
    id int auto_increment primary key,
    name varchar(64) unique not null
);

create table FACULTY (
    id int auto_increment primary key,
    name varchar(64) unique not null
);

create table SEMESTER (
    id int primary key,
    year int not null,
    num_semester int not null,
    start_date date not null,
    end_date date not null,
    name varchar(128) not null
);

create table STUDENT (
    id int auto_increment primary key,
    name varchar(128) not null,
    surname varchar(256) not null,
    -- TRUE: male; FALSE: female
    gender boolean not null,
    birthdate date not null,
    nationality varchar(2) not null,
    email varchar(128) unique not null,
    phone varchar(16),
    studies int,
    faculty int,
    foreign key (nationality) references COUNTRY(country_code),
    foreign key (studies) references STUDIES(id),
    foreign key (faculty) references FACULTY(id)
);

create table ERASMUS (
    id int auto_increment primary key,
    semester_id int not null,
    register_date timestamp default current_timestamp,
    erasmus int not null,
    -- TRUE: male; FALSE: female; NULL: no preference
    gender_preference boolean,
    -- TRUE: Spanish; FALSE: English; NULL: no preference
    language_preference boolean,
    arrival_date datetime,
    notes varchar(1024),
    foreign key (semester_id) references SEMESTER(id),
    foreign key (erasmus) references STUDENT(id)
        on update cascade
        on delete cascade
);

create table PEER (
    id int auto_increment primary key,
    semester_id int not null,
    register_date timestamp default current_timestamp,
    peer int not null,
    -- TRUE: male; FALSE: female; NULL: no preference
    gender_preference boolean,
    -- 'XX': country; NULL: no preference
    nationality_preference varchar(2),
    erasmus_limit int not null check(erasmus_limit > 0),
    notes varchar(1024),
    aegee_member boolean not null default FALSE,
    nia varchar(6),
    speaks_english boolean not null default FALSE,
    foreign key (semester_id) references SEMESTER(id),
    foreign key (peer) references STUDENT(id)
        on update cascade
        on delete cascade,
    foreign key (nationality_preference) references COUNTRY(country_code)
);

create table BUDDY_PAIR (
    erasmus int unique not null,
    peer int not null,
    notified_erasmus boolean not null default false,
    notified_peer boolean not null default false,
    foreign key (erasmus) references ERASMUS(id)
        on update cascade
        on delete cascade,
    foreign key (peer) references PEER(id)
        on update cascade
        on delete cascade
);
