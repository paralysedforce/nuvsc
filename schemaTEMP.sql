DROP TABLE if EXISTS rooms;
CREATE TABLE rooms (
    id INTEGER,
    name TEXT,
    building TEXT,
    lat DECIMAL,
    lon DECIMAL,
    PRIMARY KEY (id, building)
);
