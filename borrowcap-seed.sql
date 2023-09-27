INSERT INTO users (username, password, first_name, last_name, email, account_balance)
VALUES
  ('testuser1', 'testpass1', 'Test1', 'User1', 'test1@user.com', 30000),
  ('testuser2', 'testpass2', 'Test2', 'User2', 'test2@user.com', 50000),
  ('testuser3', 'testpass3', 'Test3', 'User3', 'test3@user.com', 70000),
  ('testuser4', 'testpass4', 'Test4', 'User4', 'test4@user.com', 90000),
  ('testuser5', 'testpass5', 'Test5', 'User5', 'test5@user.com', 100000);


INSERT INTO roles (name, description)
VALUES
  ('admin', 'Admin role'),
  ('investor', 'Investor'),
  ('borrower', 'Borrower');