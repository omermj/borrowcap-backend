"use strict";

const db = require("../db");
const {
  NotFoundError,
  ExpressError,
  BadRequestError,
} = require("../expressError");
const { generateUpdateQuery } = require("../helpers/sql");

/** User Model */

class User {
  /** Register user with data { username, password, firstName, lastName, email,
   *  accountBalance }
   *
   * Returns { username, firstName, lastName, email, accountBalance }
   *
   * Throws BadRequestError on duplicates
   *  */
  static async register({
    username,
    password,
    firstName,
    lastName,
    email,
    accountBalance,
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

    const result = await db.query(
      `INSERT INTO users
        (username,
         password,
         first_name,
         last_name,
         email,
         account_balance)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          username,
          first_name AS "firstName",
          last_name AS "lastName",
          email,
          account_balance AS "accountBalance"
      `,
      [username, password, firstName, lastName, email, accountBalance]
    );
    const user = result.rows[0];
    return user;
  }

  /**
   * Get all users
   *
   * @returns [{username, firstName, lastName, email, accountBalance}, ...]
   */
  static async getAll() {
    const result = await db.query(
      `
      SELECT username,
        first_name AS firstName,
        last_name AS lastName,
        email,
        account_balance AS accountBalance
      FROM users
      ORDER BY username
      `
    );
    return result.rows;
  }

  /** Given a username, return user data
   *
   * @returns {username, firstName, lastName, email, accountBalance}
   *
   * @throws NotFoundError if no username is found.
   */

  static async get(username) {
    const result = await db.query(
      `SELECT username,
      first_name AS firstName,
      last_name AS lastName,
      email,
      account_balance AS accountBALANCE
      FROM users
      WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user with username: ${username}`);
    return user;
  }

  /**
   * Delete a given user from database.
   * @param {username}
   * @returns {undefined}
   * @throws {NotFoundError} if username does not exist
   */
  static async delete(username) {
    const result = await db.query(
      `DELETE
        FROM users
        WHERE username = $1
        RETURNING username`,
      [username]
    );
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

  static async update(username, data) {
    // handle password update
    // generate SQL query
    const { cols, values } = generateUpdateQuery(data, {
      firstName: "first_name",
      lastName: "last_name",
      accountBalance: "account_balance",
    });

    // get username index
    const usernameIdx = values.length + 1;

    const sqlQuery = `
      UPDATE users
      SET ${cols}
      WHERE username = $${usernameIdx}
      RETURNING
        username,
        first_name AS firstName,
        last_name AS lastName,
        email,
        account_balance AS accountBalance
      `;

    const result = await db.query(sqlQuery, [...values, username]);
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);
    return user;
  }
}

module.exports = User;
