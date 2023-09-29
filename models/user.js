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
         account_balance)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          username,
          first_name AS "firstName",
          last_name AS "lastName",
          email,
          account_balance AS "accountBalance"
      `,
      [username, hashedPwd, firstName, lastName, email, accountBalance]
    );
    const user = resultUser.rows[0];

    // assign role to user
    const userWithRoles = await User.assignRoles(user, roles);

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
      `SELECT id, 
      username,
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

  /**
   * Update a given user in database.
   * @param {username}
   * @returns {user}
   * @throws {NotFoundError} if username does not exist
   */
  static async update(username, data) {
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

  /** Authenticates user using username and password provided */

  static async authenticate(username, password) {
    // get user
    const result = await db.query(
      `SELECT id,
        username,
        password,
        first_name AS firstName,
        last_name AS lastName,
        email,
        account_balance AS accountBALANCE
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

  static async assignRoles(user, roles) {
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
          [user.id, rolesObj[role]]
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
}

module.exports = User;
