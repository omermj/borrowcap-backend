"use strict";

const db = require("../db");
const { generateUpdateQuery } = require("../helpers/sql");
const {
  NotFoundError,
  ExpressError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

/** Database Model: Approved Loan Requests */

class ApprovedRequest {
  /** Get all Approved Requests from database */
  static async getAll() {
    const result = await db.query(`
      SELECT 
        id,
        borrower_id AS "borrowerId",
        amt_requested AS "amtRequested",
        amt_approved AS "amtApproved",
        amt_funded AS "amtFunded",
        purpose_id AS "purposeId",
        income,
        other_debt AS "otherDebt",
        app_open_date AS "appOpenDate",
        app_approved_date AS "appApprovedDate",
        funding_deadline AS "fundingDeadline",
        interest_rate AS "interestRate",
        term,
        installment_amt AS "installmentAmt",
        available_for_funding AS "availableForFunding",
        is_funded AS "isFunded"
      FROM approved_requests`);
    return result.rows;
  }
}

module.exports = ApprovedRequest;
