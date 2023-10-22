const bcrypt = require("bcrypt");
const db = require("../../../db.js");
const { BCRYPT_WORK_FACTOR } = require("../../../config.js");

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

  /** Add data to tables */

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

  // Assign roles to users
  await db.query(`
    INSERT INTO users_roles (user_id, role_id)
      VALUES (1, 1), (2, 2), (3, 3)`);
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

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterAll,
  commonAfterEach,
};
