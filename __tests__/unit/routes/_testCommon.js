"use strict";

const db = require("../../../db");
const User = require("../../../models/user");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../../../config.js");
const { createToken } = require("../../../helpers/tokens");

const commonBeforeAll = async () => {
  /** DELETE data from tables */
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");

  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM roles");
  await db.query("DELETE FROM users_roles");
  await db.query("DELETE FROM purpose");
  await db.query("DELETE FROM active_requests");
  await db.query("DELETE FROM approved_requests");
  await db.query("DELETE FROM approved_requests_investors");
  await db.query("DELETE FROM cancellation_reasons");
  await db.query("DELETE FROM cancelled_requests");
  await db.query("DELETE FROM funded_loans");
  await db.query("DELETE FROM funded_loans_investors");
  await db.query("DELETE FROM paidoff_loans");
  await db.query("DELETE FROM terms");

  // Add data

  // Roles
  await db.query(
    `
    INSERT INTO roles (id, name, description)
    VALUES
      (1, 'admin', 'Admin role'),
      (2, 'borrower', 'Borrower'),
      (3, 'investor', 'Investor');
      
    `
  );
  // Users
  await db.query(
    `
    INSERT INTO users 
      (id, username, password, first_name, last_name, email, account_balance, 
      annual_income, other_monthly_debt)
    VALUES 
      (1, 'u1', $1, 'U1First', 'U1Last', 'u1@email.com', 0, 0, 0),
      (2, 'b1', $2, 'B1First', 'B1Last', 'b1@email.com', 50000, 100000, 2000),
      (3, 'i1', $3, 'I1First', 'I1Last', 'i1@email.com', 50000, 100000, 2000)
    RETURNING username
  `,
    [
      await bcrypt.hash("passwordu", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("passwordb", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("passwordi", BCRYPT_WORK_FACTOR),
    ]
  );

  // Assign roles
  await User.assignRoles(1, ["admin"]);
  await User.assignRoles(2, ["borrower"]);
  await User.assignRoles(3, ["investor"]);

  // Add purposes
  await db.query(`
    INSERT INTO purpose (id, title)
    VALUES 
      (1, 'Home'), (2, 'Car'), (3, 'Education'), (4, 'Business'), 
      (5, 'Medical'), (6, 'Other');
    `);

  // Add cancellation_reasons
  await db.query(`
    INSERT INTO cancellation_reasons (id, title)
    VALUES 
      (1, 'unmet_criteria'), (2, 'unfunded'), (3, 'user_initiated');
  `);

  // Add terms
  await db.query(`
    INSERT INTO terms (months)
    VALUES (6), (12), (24), (36), (48), (60)
  `);

  // Add ActiveRequests
  await db.query(`
    INSERT INTO active_requests (id, borrower_id, amt_requested, purpose_id, 
      app_open_date, interest_rate, term, installment_amt)
      VALUES
      (1, 2, 5000, 2, '2023/09/27', 0.084, 24, 226.14),
      (2, 2, 10000, 3, '2023/09/28', 0.094, 36, 319.86);
  `);

  // Add ApprovedRequests
  await db.query(`
      INSERT INTO approved_requests (id, borrower_id, amt_requested,
        amt_approved, amt_funded, purpose_id, app_open_date, app_approved_date,
        funding_deadline, interest_rate, term, installment_amt,
        available_for_funding, is_funded)
      VALUES
        (3, 2, 10000, 9000, 0, 1, '2023/09/25', '2023/09/26', '2023/10/26', 
          0.05, 24, 375.20, false, false),
        (4, 2, 20000, 18000, 0, 2, '2023/09/26', '2023/09/27', '2023/10/27', 
          0.07, 36, 500.54, false, false);
  `);
};

const commonBeforeEach = async () => {
  await db.query("BEGIN");
};

const commonAfterEach = async () => {
  await db.query("ROLLBACK");
};

const commonAfterAll = async () => {
  await db.end();
};

const u1Token = `Bearer ${createToken({
  id: 1,
  username: "u1",
  roles: ["admin"],
})}`;
const b1Token = `Bearer ${createToken({
  id: 2,
  username: "b1",
  roles: ["borrower"],
})}`;
const i1Token = `Bearer ${createToken({
  id: 3,
  username: "i1",
  roles: ["investor"],
})}`;

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterAll,
  commonAfterEach,
  u1Token,
  b1Token,
  i1Token,
};
