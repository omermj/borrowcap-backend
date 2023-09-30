"use strict";

const axios = require("axios");
const BASE_URL_BONDS =
  "https://www.bankofcanada.ca/valet/observations/group/bond_yields_benchmark/json";
const BASE_URL_BILLS =
  "https://www.bankofcanada.ca/valet/observations/group/tbill_all/json";

/** Fetch interest rate from Bank of Canada API */

async function getBondYields() {
  const response = await axios.get(BASE_URL_BONDS);
  const data = response.data.observations;
  const lastDay = data[data.length - 1];

  const yields = {};

  for (const key in lastDay) {
    if (key.includes("2YR") || key.includes("3YR") || key.includes("5YR")) {
      const label = key.replace("BD.CDN.", "").replace(".DQ.YLD", "");
      yields[label] = +lastDay[key].v;
    }
  }
  return yields;
}

async function getBillYields() {
  const response = await axios.get(BASE_URL_BILLS);
  const data = response.data.observations;
  const lastDay = data[data.length - 1];

  return {
    "1M": +lastDay["V80691342"].v,
    "3M": +lastDay["V80691344"].v,
    "6M": +lastDay["V80691345"].v,
    "1YR": +lastDay["V80691346"].v,
  };
}

async function getInterestRates() {
  const bonds = await getBondYields();
  const bills = await getBillYields();
  return { ...bonds, ...bills };
}

module.exports = { getInterestRates };