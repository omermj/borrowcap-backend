"use strict";

const pg = require("pg");
const { DB_NAME } = require("./config");

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: DB_NAME,
  password: "postgres",
  port: 5432,
});

db.connect();

module.exports = db;
