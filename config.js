"use strict";

require("dotenv").config();

/** Config file for app */

const PORT = +process.env.PORT || 3001;
const SECRET_KEY = process.env.SECRET_KEY || "secret-dev";
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

// Database settings
const DB_NAME =
  process.env.NODE_ENV === "test"
    ? "borrowcap_test"
    : process.env.DB_NAME || "borrowcap_dev";

const DB_USER = process.env.DB_USER || "postgres";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PASSWORD = process.env.DB_PASSWORD || "postgres";
const DB_PORT = +process.env.DB_PORT || "5432";

const FUNDING_DAYS = 30; //No. of days approved requests have to get funded
const PROFIT_MARGIN = 0.02; // Profit margin on market interest rate

module.exports = {
  PORT,
  BCRYPT_WORK_FACTOR,
  SECRET_KEY,
  FUNDING_DAYS,
  PROFIT_MARGIN,
  DB_NAME,
  DB_USER,
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
};
