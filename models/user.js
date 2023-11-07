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
        0,
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
      ORDER BY id
      `
    );
    return result.rows;
  }

  /** Given a user id, return user data
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

  /** Get user by username */
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
   * @param {id}
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
  static async update(username, data) {
    // bad request error if there is no data
    if (!data) throw new BadRequestError("Data is required");

    // handle password update
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    // generate SQL query
    const { cols, values } = generateUpdateQuery(data, {
      firstName: "first_name",
      lastName: "last_name",
      accountBalance: "account_balance",
      annualIncome: "annual_income",
      otherMonthlyDebt: "other_monthly_debt",
    });

    // get username index
    const usernameIdx = values.length + 1;

    const sqlQuery = `
      UPDATE users
      SET ${cols}
      WHERE username = $${usernameIdx}
      RETURNING
        id,
        username,
        first_name AS "firstName",
        last_name AS "lastName",
        email,
        account_balance AS "accountBalance",
        annual_income AS "annualIncome",
        other_monthly_debt AS "otherMonthlyDebt"
      `;

    const result = await db.query(sqlQuery, [...values, username]);
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user with username: ${username}`);
    return user;
  }

  /** Update password */
  static async updatePassword(username, currentPassword, newPassword) {
    // validate current password
    const validate = await this.authenticate(username, currentPassword);
    if (!validate) throw new UnauthorizedError("Invalid username/password");

    // change password
    const user = await this.update(username, { password: newPassword });
    if (!user) throw new ExpressError("Error updating password");

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
      throw new BadRequestError("Incorrect role(s)");
    }
  }

  // Get roles assigned to user given userId
  static async getRoles(userId) {
    // check if userId is valid
    const user = await db.query(`SELECT id FROM users WHERE id = $1`, [userId]);
    if (!user.rows[0]) throw new NotFoundError(`No user with id: ${userId}`);

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

  /** Deposit funds - increase User account balance */
  static async depositFunds(id, amount) {
    // Check if id exists
    const user = await User.get(id);
    if (!user) throw new NotFoundError(`No user with id: ${id}`);

    // Validate amount
    if (amount < 0) throw new BadRequestError("Amount must be greater than 0");

    // Calculate new account balance amount
    let updatedAccountBalance = +user.accountBalance + +amount;

    const result = await db.query(
      `
      UPDATE users
        SET account_balance = $1
        WHERE id = $2
        RETURNING
        account_balance AS "accountBalance"
      `,
      [updatedAccountBalance, id]
    );
    return result.rows[0];
  }

  /** Withdraw funds - decrease User account balance */
  static async withdrawFunds(id, amount) {
    // Check if id exists
    const user = await User.get(id);
    if (!user) throw new NotFoundError(`No user with id: ${id}`);

    // Validate amount
    if (amount < 0) throw new BadRequestError("Amount must be greater than 0");

    // Calculate new account balance amount
    let updatedAccountBalance = +user.accountBalance - +amount;
    if (updatedAccountBalance < 0)
      throw new BadRequestError("Cannot withdraw more than account balance.");

    const result = await db.query(
      `
      UPDATE users
        SET account_balance = $1
        WHERE id = $2
        RETURNING
        account_balance AS "accountBalance"
      `,
      [updatedAccountBalance, id]
    );
    return result.rows[0];
  }
}

module.exports = User;
