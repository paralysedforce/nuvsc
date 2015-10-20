DROP TABLE if EXISTS terms;
CREATE TABLE terms (
    id INTEGER PRIMARY KEY,
    name TEXT,
    start_date TEXT,
    end_date TEXT
);

DROP TABLE if EXISTS schools;
CREATE TABLE schools (
    symbol TEXT PRIMARY KEY,
    name TEXT
);

DROP TABLE if EXISTS subjects;
CREATE TABLE subjects (
    symbol TEXT,
    name TEXT,
    school TEXT,
    PRIMARY KEY (symbol, school),
    FOREIGN KEY (school) REFERENCES schools (symbol)
);

DROP TABLE if EXISTS courses;
CREATE TABLE courses (
    name TEXT PRIMARY KEY,
    term TEXT,
    subject TEXT,
    FOREIGN KEY (subject) REFERENCES subjects (symbol)
);

DROP TABLE if EXISTS sections;
CREATE TABLE sections (
    id INTEGER PRIMARY KEY,
    catalog_num TEXT,
    title TEXT,
    dow TEXT,
    start_time TEXT,
    end_time TEXT,
    instructor TEXT,
    section TEXT,
    course TEXT,
    location TEXT,
    overview TEXT,
    requirements TEXT,
    FOREIGN KEY (course) REFERENCES courses (name),
    FOREIGN KEY (id) REFERENCES descriptions (id),
    FOREIGN KEY (id) REFERENCES components (id)
);

DROP TABLE if EXISTS descriptions;
CREATE TABLE descriptions (
    id INTEGER,
    name TEXT,
    description TEXT
);

DROP TABLE if EXISTS components;
CREATE TABLE components (
    id INTEGER,
    component TEXT,
    dow TEXT,
    start_time TEXT,
    end_time TEXT,
    section TEXT,
    room TEXT
);

DROP TABLE if EXISTS rooms;
CREATE TABLE rooms (
    id INTEGER,
    name TEXT,
    building TEXT,
    lat DECIMAL,
    lon DECIMAL,
    PRIMARY KEY (id, building)
);
