"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");

class Purpose {
  static async getAll() {
    const result = await db.query(
      `SELECT id, title
        FROM purpose
        ORDER BY id`
    );

    // create roles object
    const purposes = {};
    result.rows.map((purpose) => (purposes[purpose.title] = purpose.id));

    return purposes;
  }

  static async get(id) {
    const result = await db.query(
      `
      SELECT id, title
        FROM purpose
        WHERE id = $1
    `,
      [id]
    );
    const purpose = result.rows[0];
    if (!purpose)
      throw new NotFoundError(`Purpose with id of ${id} does not exist.`);
    return purpose;
  }
}

module.exports = Purpose;
