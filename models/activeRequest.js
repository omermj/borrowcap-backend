"use strict";

const db = require("../db");
const { generateUpdateQuery } = require("../helpers/sql");
const {
  NotFoundError,
  ExpressError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const { FUNDING_DAYS } = require("../config");
const CancelledRequest = require("./cancelledRequest");
const CancellationReason = require("./cancellationReason");
const ApprovedRequest = require("./approvedRequest");

/** Database Model: Active Loan Requests */

class ActiveRequest {
  /** Create Active Request */
  static async create({ borrowerId, amtRequested, purposeId, term }) {
    // Get date
    const date = new Date().toUTCString();

    // Get interest rate
    const interestRate = 0.089;

    // Calculate installment amount
    const pmt = this.calculatePayment(amtRequested, interestRate / 12, term);

    const result = await db.query(
      `
    INSERT INTO active_requests
      (borrower_id,
        amt_requested,
        purpose_id,
        app_open_date,
        interest_rate,
        term,
        installment_amt)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        borrower_id AS "borrowerId",
        amt_requested AS "amtRequested",
        purpose_id AS "purposeId",
        app_open_date AS "appOpenDate",
        interest_rate AS "interestRate",
        term,
        installment_amt AS "installmentAmt"
    `,
      [borrowerId, amtRequested, purposeId, date, interestRate, term, pmt]
    );

    return result.rows[0];
  }

  /** Get all Active Requests in the database */

  static async getAll() {
    const result = await db.query(`
      SELECT 
        id,
        borrower_id AS "borrowerId",
        amt_requested AS "amtRequested",
        purpose_id AS "purposeId",
        app_open_date AS "appOpenDate",
        interest_rate AS "interestRate",
        term,
        installment_amt as "installmentAmt"
      FROM active_requests`);
    return result.rows;
  }

  /** Get specific Active Request from the database, given id */

  static async get(id) {
    const result = await db.query(
      `
    SELECT 
      id,
      borrower_id AS "borrowerId",
      amt_requested AS "amtRequested",
      purpose_id AS "purposeId",
      app_open_date AS "appOpenDate",
      interest_rate AS "interestRate",
      term,
      installment_amt as "installmentAmt"
    FROM active_requests
    WHERE id = $1
    `,
      [id]
    );
    const activeRequest = result.rows[0];
    if (!activeRequest)
      throw new NotFoundError(`No Active Request exists with id: ${id}`);
    return activeRequest;
  }

  /** Update Active Request, given id and data
   * Fields allowed to be updated: amt_requested, purpose_id, interest_rate, term
   */

  static async update(id, data) {
    // generate SQL query
    const { cols, values } = generateUpdateQuery(data, {
      amtRequested: "amt_requested",
      purposeId: "purpose_id",
      interestRate: "interest_rate",
    });

    const sqlQuery = `
    UPDATE active_requests 
      SET ${cols}
      WHERE id = $${values.length + 1}
      RETURNING
        id,
        borrower_id AS "borrowerId",
        amt_requested AS "amtRequested",
        purpose_id AS "purposeId",
        app_open_date AS "appOpenDate",
        interest_rate AS "interestRate",
        term,
        installment_amt AS "installmentAmt"
    `;

    const result = await db.query(sqlQuery, [...values, id]);
    const activeRequest = result.rows[0];

    if (!activeRequest)
      throw new NotFoundError(`No Active Request exists with id: ${id}`);

    return activeRequest;
  }

  /** Delete Active Request, given id. Returns true if successful. */

  static async delete(id) {
    const result = await db.query(
      `
    DELETE
      FROM active_requests
      WHERE id = $1
      RETURNING id`,
      [id]
    );
    const appId = result.rows[0];
    if (!appId)
      throw new NotFoundError(`No Active Request exists with id: ${id}`);
    return true;
  }

  //** Approve Active Request */
  static async approve(id, data) {
    const activeRequest = await ActiveRequest.get(id);
    const { interestRate, amtApproved, term } = data;

    // Get approval date
    const appApprovedDate = new Date().toUTCString();

    // get funding deadline
    const fundingDeadline = this.getFundingDeadline(
      appApprovedDate,
      FUNDING_DAYS
    );

    // Calculate installment amount
    const pmt = this.calculatePayment(amtApproved, interestRate / 12, term);

    // Get active request from database
    activeRequest.interestRate = interestRate;
    activeRequest.term = term;
    activeRequest.installmentAmt = pmt;

    const approvedRequest = await ApprovedRequest.create({
      ...activeRequest,
      amtApproved,
      amtFunded: 0,
      appApprovedDate,
      fundingDeadline,
      availableForFunding: false,
      isFunded: false,
    });

    if (!approvedRequest)
      throw new BadRequestError(`No Active Request exists with id: ${id}`);

    // Remove Active Request from active_request table
    ActiveRequest.delete(id);

    return approvedRequest;
  }

  static calculatePayment(pv, r, n) {
    return ((pv * r) / (1 - (1 + r) ** -n)).toFixed(2);
  }

  static getFundingDeadline(approvalDate, days) {
    const fundingDeadline = new Date(approvalDate);
    fundingDeadline.setDate(fundingDeadline.getDate() + days);
    return fundingDeadline.toUTCString();
  }

  /** Reject Active Request */
  static async reject(id) {
    // Retrive app from database
    const activeRequest = await ActiveRequest.get(id);

    // Get date
    const date = new Date().toUTCString();

    // Retrieve cancellationReasonId
    const cancellationReasons = await CancellationReason.getAll();
    const cancellationReasonId = cancellationReasons["unmet_criteria"];

    // Create entry in cancelled_requests table
    const cancelledApp = await CancelledRequest.create({
      ...activeRequest,
      amtApproved: 0,
      appApprovedDate: null,
      appCancelledDate: date,
      fundingDeadline: null,
      wasApproved: false,
      cancellationReasonId,
    });

    // Delete active request from active_requests table
    if (cancelledApp) {
      ActiveRequest.delete(id);
      return true;
    } else return false;
  }
}

module.exports = ActiveRequest;
