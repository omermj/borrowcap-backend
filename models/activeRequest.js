"use strict";

const db = require("../db");
const { generateUpdateQuery } = require("../helpers/sql");
const {
  NotFoundError,
  ExpressError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const app = require("../app");

/** Database Model: Active Loan Requests */

class ActiveRequest {
  /** Create Loan Request */
  static async create({
    borrowerId,
    amtRequested,
    purposeId,
    income,
    otherDebt,
    durationMonths,
  }) {
    // Get date
    const date = new Date().toUTCString();

    // Get interest rate
    const interestRate = 0.089;

    // Calculate installment amount
    const pmt = this.calculatePayment(
      amtRequested,
      interestRate / 12,
      durationMonths
    );

    const result = await db.query(
      `
    INSERT INTO active_requests
      (borrower_id,
        amt_requested,
        purpose_id,
        income,
        other_debt,
        app_open_date,
        interest_rate,
        duration_months,
        installment_amt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        borrower_id AS borrowerId,
        amt_requested AS amtRequested,
        purpose_id AS purposeId,
        income,
        other_debt AS otherDebt,
        app_open_date AS appOpenDate,
        interest_rate AS interestRate,
        duration_months AS durationMonths,
        installment_amt AS installmentAmt
    `,
      [
        borrowerId,
        amtRequested,
        purposeId,
        income,
        otherDebt,
        date,
        interestRate,
        durationMonths,
        pmt,
      ]
    );

    return result.rows[0];
  }

  /** Get all Active Requests in the database */

  static async getAll() {
    const result = await db.query(`
      SELECT 
        id,
        borrower_id AS borrowerId,
        amt_requested AS amtRequested,
        purpose_id AS purposeId,
        income,
        other_debt AS otherDebt,
        app_open_date AS appOpenDate,
        interest_rate AS interestRate,
        duration_months as durationMonths,
        installment_amt as installmentAmt
      FROM active_requests`);
    return result.rows;
  }

  /** Get specific Active Request from the database, given id */

  static async get(id) {
    const result = await db.query(
      `
    SELECT 
      id,
      borrower_id AS borrowerId,
      amt_requested AS amtRequested,
      purpose_id AS purposeId,
      income,
      other_debt AS otherDebt,
      app_open_date AS appOpenDate,
      interest_rate AS interestRate,
      duration_months as durationMonths,
      installment_amt as installmentAmt
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
   * Fields allowed to be updated: amt_requested, purpose_id, income,
   * other_debt, interest_rate, duration_months
   */

  static async update(id, data) {
    // generate SQL query
    const { cols, values } = generateUpdateQuery(data, {
      amtRequested: "amt_requested",
      purposeId: "purpose_id",
      otherDebt: "other_debt",
      interestRate: "interest_rate",
      durationMonths: "duration_months",
    });

    const sqlQuery = `
    UPDATE active_requests 
      SET ${cols}
      WHERE id = $${values.length + 1}
      RETURNING
        id,
        borrower_id AS borrowerId,
        amt_requested AS amtRequested,
        purpose_id AS purposeId,
        income,
        other_debt AS otherDebt,
        app_open_date AS appOpenDate,
        interest_rate AS interestRate,
        duration_months AS durationMonths,
        installment_amt AS installmentAmt
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
    const { interestRate, amtApproved, durationMonths } = data;

    // Get date
    const date = new Date().toUTCString();

    // Calculate installment amount
    const pmt = this.calculatePayment(
      amtApproved,
      interestRate / 12,
      durationMonths
    );

    const result = await db.query(
      `
      INSERT INTO approved_requests
        (id,
          borrower_id,
          amt_requested,
          amt_approved,
          purpose_id,
          income,
          other_debt,
          app_open_date,
          app_approved_date,
          interest_rate,
          duration_months,
          installment_amt)
      SELECT
        id,
          borrower_id,
          amt_requested,
          $2,
          purpose_id,
          income,
          other_debt,
          app_open_date,
          $3,
          $4,
          duration_months,
          $5
        FROM active_requests
        WHERE id = $1
        RETURNING
          id,
          borrower_id AS borrowerId,
          amt_requested AS amtRequested,
          amt_approved AS amtApproved,
          purpose_id AS purposeId,
          income,
          other_debt AS otherDebt,
          app_open_date AS appOpenDate,
          app_approved_date AS appApprovedDate,
          interest_rate AS interestRate,
          duration_months AS durationMonths,
          installment_amt AS installmentAmt
    `,
      [id, amtApproved, date, interestRate, pmt]
    );
    const approvedRequest = result.rows[0];
    console.log(approvedRequest);
    if (!approvedRequest)
      throw new BadRequestError(`No Active Request exists with id: ${id}`);
    return approvedRequest;
  }

  static calculatePayment(pv, r, n) {
    return ((pv * r) / (1 - (1 + r) ** -n)).toFixed(2);
  }
}

module.exports = ActiveRequest;
