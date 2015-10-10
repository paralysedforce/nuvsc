CREATE TABLE terms (
    id INTEGER PRIMARY KEY,
    name TEXT,
    start_date TEXT,
    end_date TEXT
);

CREATE TABLE schools (
    symbol TEXT PRIMARY KEY,
    name TEXT
);

CREATE TABLE subjects (
    symbol TEXT,
    name TEXT,
    school TEXT,
    PRIMARY KEY (symbol, school),
    FOREIGN KEY (school) REFERENCES schools (symbol)
);

CREATE TABLE courses (
    name TEXT PRIMARY KEY,
    term TEXT,
    subject TEXT,
    FOREIGN KEY (subject) REFERENCES subjects (symbol)
);

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
    FOREIGN KEY (course) REFERENCES courses (name)
);
