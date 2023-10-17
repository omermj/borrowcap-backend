"use strict";

const db = require("../db");

class Term {
  static async getAll() {
    const result = await db.query(
      `SELECT months
        FROM terms`
    );
    return result.rows;
  }
}

module.exports = Term;
