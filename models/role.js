"use strict";

const db = require("../db");

class Role {
  static async getAll() {
    const result = await db.query(
      `SELECT id, name
        FROM roles
        ORDER BY id`
    );
    
    // create roles object
    const roles = {};
    result.rows.map((role) => (roles[role.name] = role.id));

    return roles;
  }
}

module.exports = Role;
