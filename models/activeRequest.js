"use strict";

const db = require("../db");
const User = require("../models/user");
const { generateUpdateQuery } = require("../helpers/sql");
const {
  NotFoundError,
  ExpressError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const { FUNDING_DAYS, PROFIT_MARGIN } = require("../config");
const CancelledRequest = require("./cancelledRequest");
const CancellationReason = require("./cancellationReason");
const ApprovedRequest = require("./approvedRequest");
const { getInterestRates } = require("../helpers/interestRate");
const { DatabaseError } = require("pg");

/** Database Model: Active Loan Requests */

class ActiveRequest {
  /** Create Active Request */
  static async create({ borrowerId, amtRequested, purposeId, term }) {
    // Get date
    const date = new Date().toUTCString();

    // Get interest rate
    const interestRates = await getInterestRates();
    const interestRate = (interestRates[term] / 100 + PROFIT_MARGIN).toFixed(4);

    // Calculate installment amount
    const pmt = this.calculatePayment(amtRequested, interestRate / 12, term);

    try {
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
    } catch (e) {
      throw new DatabaseError();
    }
  }

  /** Get all Active Requests in the database */
  static async getAll() {
    const result = await db.query(`
      SELECT 
        r.id,
        r.borrower_id AS "borrowerId",
        r.amt_requested AS "amtRequested",
        p.title AS "purpose",
        p.id AS "purposeId",
        r.app_open_date AS "appOpenDate",
        r.interest_rate AS "interestRate",
        r.term,
        r.installment_amt as "installmentAmt"
      FROM active_requests AS "r"
      JOIN purpose AS "p" ON p.id = r.purpose_id
      ORDER BY r.id
      `);
    return result.rows;
  }

  /** Get specific Active Request from the database, given id */
  static async get(id) {
    const result = await db.query(
      `
    SELECT 
      r.id,
      r.borrower_id AS "borrowerId",
      r.amt_requested AS "amtRequested",
      p.title AS "purpose",
      p.id AS "purposeId",
      r.app_open_date AS "appOpenDate",
      r.interest_rate AS "interestRate",
      r.term,
      r.installment_amt AS "installmentAmt",
      u.username AS "username",
      u.first_name AS "firstName",
      u.last_name AS "lastName",
      u.email AS "email",
      u.account_balance AS "accountBalance",
      u.annual_income AS "annualIncome",
      u.other_monthly_debt AS "otherMonthlyDebt"
    FROM active_requests AS "r"
    JOIN purpose AS "p" ON p.id = r.purpose_id
    JOIN users AS "u" ON u.id = r.borrower_id
    WHERE r.id = $1
    `,
      [id]
    );
    const activeRequest = result.rows[0];
    if (!activeRequest)
      throw new NotFoundError(`No Active Request exists with id: ${id}`);
    return activeRequest;
  }

  /** Get Active Requests for a given BorrowerId */
  static async getByBorrowerId(id) {
    // Check if BorrowerId exists
    const borrower = await User.get(id);
    if (!borrower) throw new NotFoundError(`No borrower with id: ${id}`);

    const result = await db.query(
      `SELECT 
        r.id,
        r.amt_requested AS "amtRequested",
        p.title AS "purpose",
        r.app_open_date AS "appOpenDate",
        r.interest_rate AS "interestRate",
        r.term,
        r.installment_amt as "installmentAmt"
      FROM active_requests AS "r"
      JOIN purpose AS "p" ON p.id = r.purpose_id
      WHERE r.borrower_id = $1
      ORDER BY r.app_open_date DESC`,
      [id]
    );
    return result.rows;
  }

  /** Update Active Request, given id and data
   * Fields allowed to be updated: amt_requested, purpose_id, interest_rate, term
   */

  static async update(id, data) {
    // validate data
    const allowedKeys = ["amtRequested", "purposeId", "interestRate", "term"];
    if (!Object.keys(data).every((el) => allowedKeys.includes(el))) {
      throw new BadRequestError("Invalid data for update");
    }

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

    let result = await db.query(sqlQuery, [...values, id]);
    let activeRequest = result.rows[0];

    if (!activeRequest)
      throw new NotFoundError(`No Active Request exists with id: ${id}`);

    // recalculate and update installmentAmt
    const pmt = this.calculatePayment(
      activeRequest.amtRequested,
      activeRequest.interestRate / 12,
      activeRequest.term
    );
    result = await db.query(
      `
      UPDATE active_requests
        SET installment_amt = $1
        WHERE id = $2
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
      [pmt, id]
    );
    activeRequest = result.rows[0];

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
    if (!this.validateApprovalData(data)) throw new BadRequestError();

    const activeRequest = await ActiveRequest.get(id);
    const { interestRate, amtApproved, term } = data;
    data.term = String(data.term);

    // Get approval date
    const appApprovedDate = new Date().toUTCString();

    // get funding deadline
    const fundingDeadline = this.getFundingDeadline(
      appApprovedDate,
      FUNDING_DAYS
    );

    try {
    } catch (e) {}
    // Calculate installment amount
    const pmt = this.calculatePayment(amtApproved, interestRate / 12, term);

    // Modify active request parameters
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
    const pmt = +((pv * r) / (1 - (1 + r) ** -n)).toFixed(2);
    if (isNaN(+pmt)) throw new BadRequestError("Invalid parameters");
    return pmt;
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

  static validateApprovalData(data) {
    if (!data.interestRate || !data.amtApproved || !data.term) {
      return false;
    }
    if (
      isNaN(+data.interestRate) ||
      +data.interestRate < 0.00001 ||
      +data.interestRate > 1
    ) {
      return false;
    }
    if (isNaN(+data.amtApproved) || +data.amtApproved < 1) {
      return false;
    }
    if (!["6", "12", "24", "36", "48", "60"].includes(String(data.term))) {
      return false;
    }
    return true;
  }
}

module.exports = ActiveRequest;
