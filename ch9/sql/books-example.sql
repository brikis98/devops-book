CREATE TABLE books (
  id                SERIAL PRIMARY KEY,
  title             VARCHAR(128),
  genre             VARCHAR(50),
  year_published    INTEGER
);

INSERT INTO books (title, genre, year_published)
VALUES            ('Clean Code', 'tech', 2008);

INSERT INTO books (title, genre, year_published)
VALUES            ('Code Complete', 'tech', 1993);

INSERT INTO books (title, genre, year_published)
VALUES            ('The Giver', 'sci-fi', 1993);

SELECT * FROM books WHERE year_published = 1993;

SELECT COUNT(*) FROM books WHERE year_published = 1993;
