INSERT INTO users 
  (username, password, first_name, last_name, email, account_balance, 
    annual_income, other_monthly_debt)
VALUES
  ('borrower1', 'testpass1', 'Borrower1', 'User1', 'test1@user.com', 30000, 
    100000, 1200),
  ('investor2', 'testpass2', 'Investor2', 'User2', 'test2@user.com', 50000, 
    80000, 2000),
  ('testuser3', 'testpass3', 'Test3', 'User3', 'test3@user.com', 70000, 
    120000, 5000),
  ('testuser4', 'testpass4', 'Test4', 'User4', 'test4@user.com', 90000, 
    60000, 500),
  ('testuser5', 'testpass5', 'Test5', 'User5', 'test5@user.com', 100000, 
    320000, 3000);


INSERT INTO roles (name, description)
VALUES
  ('admin', 'Admin role'),
  ('investor', 'Investor'),
  ('borrower', 'Borrower');

INSERT INTO users_roles (user_id, role_id)
VALUES
  (1, 3),
  (2, 2);

INSERT INTO purpose (title)
VALUES 
  ('home'), ('car'), ('education'), ('business'), ('medical'), ('other');

INSERT INTO cancellation_reasons (title)
VALUES 
  ('unmet_criteria'), ('unfunded'), ('user_initiated');

-- FEED ACTIVE REQUESTS
INSERT INTO active_requests (borrower_id, amt_requested, purpose_id, 
  app_open_date, interest_rate, term, installment_amt)
  VALUES
  (1, 5000, 2, '2023/09/27', 0.084, 24, 226.14),
  (1, 10000, 3, '2023/09/28', 0.094, 36, 319.86);
