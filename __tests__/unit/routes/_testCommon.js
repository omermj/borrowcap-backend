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
