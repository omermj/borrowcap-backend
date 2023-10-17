"use strict";

/** Config file for app */

const PORT = 3001;
const BCRYPT_WORK_FACTOR = 12;
const SECRET_KEY = "secret-dev";
const FUNDING_DAYS = 30; //No. of days approved requests have to get funded
const PROFIT_MARGIN = 0.02;

module.exports = { PORT, BCRYPT_WORK_FACTOR, SECRET_KEY, FUNDING_DAYS, PROFIT_MARGIN };
