SET TIMEZONE = 'UTC';

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(25) NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  account_balance NUMERIC NOT NULL,
  annual_income NUMERIC NOT NULL,
  other_monthly_debt NUMERIC NOT NULL);

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
  purpose_id INTEGER,
  app_open_date TIMESTAMP NOT NULL,
  interest_rate NUMERIC NOT NULL,
  term INTEGER NOT NULL,
  installment_amt NUMERIC NOT NULL,
  FOREIGN KEY (purpose_id) REFERENCES purpose (id) ON DELETE SET NULL,
  FOREIGN KEY (borrower_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE approved_requests (
  id INTEGER PRIMARY KEY NOT NULL,
  borrower_id INTEGER NOT NULL,
  amt_requested NUMERIC NOT NULL,
  amt_approved NUMERIC NOT NULL,
  amt_funded NUMERIC NOT NULL,
  purpose_id INTEGER,
  app_open_date TIMESTAMP NOT NULL,
  app_approved_date TIMESTAMP NOT NULL,
  funding_deadline TIMESTAMP NOT NULL,
  interest_rate NUMERIC NOT NULL,
  term INTEGER NOT NULL,
  installment_amt NUMERIC NOT NULL,
  available_for_funding BOOLEAN NOT NULL,
  is_funded BOOLEAN NOT NULL, -- when app is fully funded, this becomes true
  FOREIGN KEY (purpose_id) REFERENCES purpose (id) ON DELETE SET NULL,
  FOREIGN KEY (borrower_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE approved_requests_investors (
  request_id INTEGER,
  investor_id INTEGER,
  pledged_amt NUMERIC NOT NULL,
  FOREIGN KEY (request_id) REFERENCES approved_requests (id) ON DELETE CASCADE,
  FOREIGN KEY (investor_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE cancellation_reasons (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL
);

CREATE TABLE cancelled_requests (
  id INTEGER PRIMARY KEY NOT NULL,
  borrower_id INTEGER NOT NULL,
  amt_requested NUMERIC NOT NULL,
  amt_approved NUMERIC,
  purpose_id INTEGER NOT NULL,
  app_open_date TIMESTAMP NOT NULL,
  app_approved_date TIMESTAMP,
  app_cancelled_date TIMESTAMP NOT NULL,
  funding_deadline TIMESTAMP,
  interest_rate NUMERIC NOT NULL,
  term INTEGER NOT NULL,
  installment_amt NUMERIC NOT NULL,
  was_approved BOOLEAN NOT NULL,
  cancellation_reason_id INTEGER NOT NULL,
  FOREIGN KEY (purpose_id) REFERENCES purpose (id) ON DELETE SET NULL,
  FOREIGN KEY (cancellation_reason_id) REFERENCES cancellation_reasons (id) ON DELETE SET NULL,
  FOREIGN KEY (borrower_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE funded_loans (
  id INTEGER PRIMARY KEY NOT NULL,
  borrower_id INTEGER,
  amt_funded NUMERIC NOT NULL,
  funded_date TIMESTAMP NOT NULL,
  interest_rate NUMERIC NOT NULL,
  term INTEGER NOT NULL,
  installment_amt NUMERIC NOT NULL,
  remaining_balance NUMERIC NOT NULL,
  FOREIGN KEY (id) REFERENCES approved_requests (id) ON DELETE SET NULL,
  FOREIGN KEY (borrower_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE funded_loans_investors (
  loan_id INTEGER,
  investor_id INTEGER,
  invested_amt NUMERIC NOT NULL,
  FOREIGN KEY (loan_id) REFERENCES funded_loans (id) ON DELETE CASCADE,
  FOREIGN KEY (investor_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE paidoff_loans (
  id INTEGER PRIMARY KEY NOT NULL,
  borrower_id INTEGER,
  amt_funded NUMERIC NOT NULL,
  funded_date TIMESTAMP NOT NULL,
  paidoff_date TIMESTAMP NOT NULL,
  interest_rate NUMERIC NOT NULL,
  term INTEGER NOT NULL,
  installment_amt NUMERIC NOT NULL,
  FOREIGN KEY (borrower_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE terms (
  months INTEGER PRIMARY KEY NOT NULL
);