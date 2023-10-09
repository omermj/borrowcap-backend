"use strict";

const db = require("../db");
const {
  NotFoundError,
  ExpressError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const bcrypt = require("bcrypt");

const { generateUpdateQuery } = require("../helpers/sql");
const { BCRYPT_WORK_FACTOR } = require("../config");

const Role = require("./role");

/** User Model */

class User {
  /** Add user with data { username, password, firstName, lastName, email,
   *  accountBalance }
   *
   * Returns { username, firstName, lastName, email, accountBalance, roles }
   *
   * where role is an array of allowed roles
   *
   * Throws BadRequestError on duplicates
   *  */
  static async add({
    username,
    password,
    firstName,
    lastName,
    email,
    accountBalance,
    annualIncome,
    otherMonthlyDebt,
    roles,
  }) {
    // Check for duplicates
    const duplicateCheck = await db.query(
      `SELECT username
        FROM users
        WHERE username = $1`,
      [username]
    );
    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate username: ${username}`);

    // check if role exists
    const rolesObj = await Role.getAll();
    if (!Array.isArray(roles) || !roles.every((role) => role in rolesObj)) {
      throw new BadRequestError("Incorrect role(s).");
    }

    // hash password
    const hashedPwd = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    // create entry in user table
    const resultUser = await db.query(
      `INSERT INTO users
        (username,
         password,
         first_name,
         last_name,
         email,
         account_balance,
         annual_income,
         other_monthly_debt)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          id,
          username,
          first_name AS "firstName",
          last_name AS "lastName",
          email,
          account_balance AS "accountBalance",
          annual_income AS "annualIncome",
          other_monthly_debt AS "otherMonthlyDebt"
      `,
      [
        username,
        hashedPwd,
        firstName,
        lastName,
        email,
        accountBalance,
        annualIncome,
        otherMonthlyDebt,
      ]
    );
    const user = resultUser.rows[0];

    // assign role to user
    const userWithRoles = await User.assignRoles(user.id, roles);

    return userWithRoles;
  }

  /**
   * Get all users
   *
   * @returns [{username, firstName, lastName, email, accountBalance}, ...]
   */
  static async getAll() {
    const result = await db.query(
      `
      SELECT id, 
        username,
        first_name AS "firstName",
        last_name AS "lastName",
        email,
        account_balance AS "accountBalance",
        annual_income AS "annualIncome",
        other_monthly_debt AS "otherMonthlyDebt"
      FROM users
      ORDER BY username
      `
    );

    return result.rows;
  }

  /** Given a username, return user data
   *
   * @returns {username, firstName, lastName, email, accountBalance,
   *  annualIncome, otherMonthlyDebt}
   *
   * @throws NotFoundError if no username is found.
   */

  static async get(id) {
    const result = await db.query(
      `SELECT id, 
        username,
        first_name AS "firstName",
        last_name AS "lastName",
        email,
        account_balance AS "accountBalance",
        annual_income AS "annualIncome",
        other_monthly_debt AS "otherMonthlyDebt"
      FROM users
      WHERE id = $1`,
      [id]
    );
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user with id: ${id}`);

    // get roles from database
    const roles = await User.getRoles(user.id);

    return { ...user, roles };
  }

  /** Get user by given username */
  static async getByUsername(username) {
    const result = await db.query(
      `SELECT id, 
        username,
        first_name AS "firstName",
        last_name AS "lastName",
        email,
        account_balance AS "accountBalance",
        annual_income AS "annualIncome",
        other_monthly_debt AS "otherMonthlyDebt"
      FROM users
      WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user with username: ${username}`);

    // get roles from database
    const roles = await User.getRoles(user.id);

    return { ...user, roles };
  }

  /**
   * Delete a given user from database.
   * @param {username}
   * @returns {undefined}
   * @throws {NotFoundError} if username does not exist
   */
  static async delete(id) {
    const result = await db.query(
      `DELETE
        FROM users
        WHERE id = $1
        RETURNING id`,
      [id]
    );
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user with id: ${id}`);
  }

  /**
   * Update a given user in database.
   * @param {username}
   * @returns {user}
   * @throws {NotFoundError} if username does not exist
   */
  static async update(id, data) {
    // handle password update
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    // generate SQL query
    const { cols, values } = generateUpdateQuery(data, {
      firstName: "first_name",
      lastName: "last_name",
      accountBalance: "account_balance",
    });

    // get username index
    const userIdIdx = values.length + 1;

    const sqlQuery = `
      UPDATE users
      SET ${cols}
      WHERE id = $${userIdIdx}
      RETURNING
        id,
        username,
        first_name AS firstName,
        last_name AS lastName,
        email,
        account_balance AS accountBalance
      `;

    const result = await db.query(sqlQuery, [...values, id]);
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user with id: ${id}`);
    return user;
  }

  /** Authenticates user using username and password provided */

  static async authenticate(username, password) {
    // get user
    const result = await db.query(
      `SELECT id,
        username,
        password,
        first_name AS "firstName",
        last_name AS "lastName",
        email,
        account_balance AS "accountBalance",
        annual_income AS "annualIncome",
        other_monthly_debt AS "otherMonthlyDebt"
      FROM users
      WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];

    // check password
    if (user) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        delete user.password;

        // get roles from database
        const roles = await User.getRoles(user.id);
        return { ...user, roles };
      }
    }
    throw new UnauthorizedError("Invalid username/password");
  }

  /** Assign roles to given user */

  static async assignRoles(userId, roles) {
    // get user from database
    const user = await User.get(userId);
    if (!user) throw new NotFoundError(`No user with id: ${userId}`);

    // get roles from database
    const rolesObj = await Role.getAll();

    // create entry in users_roles table
    try {
      for (let role of roles) {
        await db.query(
          `
        INSERT INTO users_roles
          (user_id, role_id)
        VALUES ($1, $2)`,
          [userId, rolesObj[role]]
        );
      }
      return { ...user, roles };
    } catch (e) {
      throw new ExpressError(e.message);
    }
  }

  // Get roles assigned to user given userId
  static async getRoles(userId) {
    const result = await db.query(
      `
      SELECT name FROM roles
      JOIN users_roles ON roles.id = users_roles.role_id
      WHERE users_roles.user_id = $1
    `,
      [userId]
    );
    return result.rows.map((role) => role.name);
  }

  /** Get Active Requests for a given BorrowerId */
  static async getActiveRequests(id) {
    // Check if BorrowerId exists
    const borrower = await User.get(id);
    if (!borrower) throw new NotFoundError(`No borrower with id: ${id}`);

    const result = await db.query(
      `
  SELECT 
    r.id,
    r.amt_requested AS "amtRequested",
    p.title AS "purpose",
    r.app_open_date AS "appOpenDate",
    r.interest_rate AS "interestRate",
    r.term,
    r.installment_amt as "installmentAmt"
  FROM active_requests AS "r"
  JOIN purpose AS "p" ON p.id = r.purpose_id
  WHERE r.borrower_id = $1
  `,
      [id]
    );
    return result.rows;
  }

  /** Get Funded Loans for a given BorrowerId */
  static async getFundedLoansForBorrower(id) {
    // Check if BorrowerId exists
    const borrower = await User.get(id);
    if (!borrower) throw new NotFoundError(`No borrower with id: ${id}`);

    const result = await db.query(
      `
  SELECT 
    f.id,
    f.amt_funded AS "amtFunded",
    f.funded_date AS "fundedDate",
    f.interest_rate AS "interestRate",
    f.term,
    f.installment_amt AS "installmentAmt",
    f.remaining_balance AS "remainingBalance"
  FROM funded_loans AS "f"
  WHERE f.borrower_id = $1
  `,
      [id]
    );
    return result.rows;
  }

  static async getActiveInvestmentsForInvestor(id) {
    // Check if InvestorId exists
    const investor = await User.get(id);
    if (!investor) throw new NotFoundError(`No investor with id: ${id}`);

    const result = await db.query(
      `SELECT 
        f.id,
        l.invested_amt AS "amtInvested",
        f.amt_funded AS "amtFunded",
        f.funded_date AS "fundedDate",
        f.interest_rate AS "interestRate",
        f.term,
        f.installment_amt AS "installmentAmt",
        f.remaining_balance AS "remainingBalance"
      FROM funded_loans AS "f"
      JOIN funded_loans_investors AS "l" ON f.id = l.loan_id
      WHERE l.investor_id = $1`,
      [id]
    );
    return result.rows;
  }

  static async getPledgedInvestmentsForInvestor(id) {
    // Check if InvestorId exists
    const investor = await User.get(id);
    if (!investor) throw new NotFoundError(`No investor with id: ${id}`);

    const result = await db.query(
      `
      SELECT
        r.id AS "id",
        r.amt_approved AS "amtApproved",
        i.pledged_amt AS "amtPledged",
        r.app_approved_date AS "approvedDate",
        r.funding_deadline AS "fundingDeadline",
        r.interest_rate AS "interestRate",
        r.term AS "term"
      FROM approved_requests AS "r"
      JOIN approved_requests_investors AS "i" ON i.request_id = r.id
      WHERE i.investor_id = $1
    `,
      [id]
    );
    return result.rows;
  }
}

module.exports = User;
