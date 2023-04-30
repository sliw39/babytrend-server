-- SQLite
CREATE TABLE Survey (
    _id TEXT PRIMARY KEY,
    date DATETIME NOT NULL,
    type TEXT NOT NULL,
    weight INTEGER,
    height INTEGER,
    poop INTEGER,
    pee INTEGER,
    eat INTEGER,
    blurp INTEGER,
    temperature REAL,
    commentaire TEXT
);

