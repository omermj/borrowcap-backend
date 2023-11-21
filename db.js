"use strict";

const pg = require("pg");
const { DB_NAME, DB_USER, DB_HOST, DB_PASSWORD, DB_PORT } = require("./config");

const db = new pg.Client({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
  port: DB_PORT,
  // ssl: {
  //   rejectUnauthorized: false, // process.env.NODE_ENV === "production" ? false : true,
  // },
});

process.env.NODE_ENV === "production"
  ? (db.ssl.rejectUnauthorized = false)
  : null;

db.connect();

module.exports = db;
