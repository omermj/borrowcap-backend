"use strict";

require("dotenv").config();

/** Config file for app */

const PORT = process.env.PORT || 3001;

const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;
const DB_NAME =
  process.env.NODE_ENV === "test" ? "borrowcap_test" : "borrowcap_dev";
const SECRET_KEY = "secret-dev";
const FUNDING_DAYS = 30; //No. of days approved requests have to get funded
const PROFIT_MARGIN = 0.02;

module.exports = {
  PORT,
  BCRYPT_WORK_FACTOR,
  SECRET_KEY,
  FUNDING_DAYS,
  PROFIT_MARGIN,
  DB_NAME,
};
