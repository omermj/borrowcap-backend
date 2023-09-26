"use strict";

const pg = require("pg");

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "borrowcap_dev",
  password: "postgres",
  port: 5432,
});

db.connect();

module.exports = db;
