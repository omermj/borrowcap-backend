"use strict";

const pg = require("pg");
const { DB_NAME, DB_USER, DB_HOST, DB_PASSWORD, DB_PORT } = require("./config");

const db = new pg.Client({
  user: DB_USER, // "postgres",
  host: DB_HOST, // "localhost",
  database: DB_NAME,
  password: DB_PASSWORD, //"postgres",
  port: DB_PORT, // 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

db.connect();

module.exports = db;
