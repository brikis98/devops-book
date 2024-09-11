CREATE TABLE customers (
   id            SERIAL PRIMARY KEY,
   name          VARCHAR(128),
   date_of_birth DATE,
   balance       INT
);

INSERT INTO customers (name, date_of_birth, balance)
VALUES                ('Brian Kim', '1948-09-23', 1500);

INSERT INTO customers (name, date_of_birth, balance)
VALUES                ('Karen Johnson', '1989-11-18', 4853);

INSERT INTO customers (name, date_of_birth, balance)
VALUES                ('Wade Feinstein', '1965-02-25', 2150);

SELECT * FROM customers;

SELECT * FROM customers WHERE date_of_birth > '1950-12-31';

UPDATE customers
SET balance = balance - 100;

START TRANSACTION;
    UPDATE customers
    SET balance = balance - 100
    WHERE id = 1;

    UPDATE customers
    SET balance = balance + 100
    WHERE id = 2;
COMMIT;

CREATE TABLE accounts (
    account_id      SERIAL PRIMARY KEY,          -- <1>
    account_type    VARCHAR(20),                 -- <2>
    balance         INT,                         -- <3>
    customer_id     INT REFERENCES customers(id) -- <4>
);
