SET TIMEZONE = 'UTC';

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(25) NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  account_balance NUMERIC NOT NULL);

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(25) NOT NULL,
  description TEXT);

CREATE TABLE users_roles (
  user_id INTEGER,
  role_id INTEGER,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

CREATE TABLE purpose (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL
);

CREATE TABLE active_requests (
  id SERIAL PRIMARY KEY,
  borrower_id INTEGER NOT NULL,
  amt_requested NUMERIC NOT NULL,
  purpose_id INTEGER NOT NULL,
  income NUMERIC NOT NULL,
  other_debt NUMERIC NOT NULL,
  app_open_date TIMESTAMP NOT NULL,
  interest_rate NUMERIC NOT NULL,
  duration_months INTEGER NOT NULL,
  installment_amt NUMERIC NOT NULL,
  FOREIGN KEY (purpose_id) REFERENCES purpose (id) ON DELETE CASCADE,
  FOREIGN KEY (borrower_id) REFERENCES users (id) ON DELETE CASCADE
);

