"use strict";

const db = require("../db");

class CancellationReason {
  static async getAll() {
    const result = await db.query(
      `SELECT id, title
        FROM cancellation_reasons
        ORDER BY id`
    );

    // create roles object
    const reasons = {};
    result.rows.map((reason) => (reasons[reason.title] = reasons.id));

    return reasons;
  }
}

module.exports = CancellationReason;
