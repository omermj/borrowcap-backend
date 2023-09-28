"use strict";

const db = require("../db");
const {
  NotFoundError,
  ExpressError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

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

  static async getAll() {
    const result = await db.query(`SELECT * FROM active_requests`);
    return result.rows;
  }

  static calculatePayment(pv, r, n) {
    return ((pv * r) / (1 - (1 + r) ** -n)).toFixed(2);
  }
}

module.exports = ActiveRequest;
