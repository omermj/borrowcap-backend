"use strict";

const db = require("../db");
const {
  NotFoundError,
  ExpressError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

/** Database Model: Cancelled Loan Requests */

class CancelledRequest {
  /** Create a CancelledRequest */
  static async create({
    id,
    borrowerId,
    amtRequested,
    amtApproved,
    purposeId,
    appOpenDate,
    appApprovedDate,
    appCancelledDate,
    fundingDeadline,
    interestRate,
    term,
    installmentAmt,
    wasApproved,
    cancellationReasonId,
  }) {
    try {
      const result = await db.query(
        `
      INSERT INTO cancelled_requests
        (id,
        borrower_id,
        amt_requested,
        amt_approved,
        purpose_id,
        app_open_date,
        app_approved_date,
        app_cancelled_date,
        funding_deadline,
        interest_rate,
        term,
        installment_amt,
        was_approved,
        cancellation_reason_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING
        id,
        borrower_id AS "borrowerId",
        amt_requested AS "amtRequested",
        amt_approved AS "amtApproved",
        purpose_id AS "purposeId",
        app_open_date AS "appOpenDate",
        app_approved_date AS "appApprovedDate",
        app_cancelled_date AS "appCancelledDate",
        funding_deadline AS "fundingDeadline",
        interest_rate AS "interestRate",
        term,
        installment_amt AS "installmentAmt",
        was_approved AS "wasApproved",
        cancellation_reason_id AS "cancellationReasonId"
    `,
        [
          id,
          borrowerId,
          amtRequested,
          amtApproved,
          purposeId,
          appOpenDate,
          appApprovedDate,
          appCancelledDate,
          fundingDeadline,
          interestRate,
          term,
          installmentAmt,
          wasApproved,
          cancellationReasonId,
        ]
      );
      return result.rows[0];
    } catch (e) {
      throw new ExpressError(`Database error: ${e}`);
    }
  }

  /** Get all cancelled requests */
  static async getAll() {
    const result = await db.query(
      `SELECT
        r.id,
        r.borrower_id AS "borrowerId",
        r.amt_requested AS "amtRequested",
        r.amt_approved AS "amtApproved",
        r.purpose_id AS "purposeId",
        p.title AS "purpose",
        r.app_open_date AS "appOpenDate",
        r.app_approved_date AS "appApprovedDate",
        r.app_cancelled_date AS "appCancelledDate",
        r.interest_rate AS "interestRate",
        r.term,
        r.installment_amt AS "installmentAmt",
        r.was_approved AS "wasApproved",
        r.cancellation_reason_id AS "cancellationReasonId"
      FROM cancelled_requests as "r"
      JOIN purpose AS "p" ON p.id = r.purpose_id
      ORDER BY r.id`
    );
    return result.rows;
  }

  /** Get cancelled request by id */
  static async get(id) {
    const result = await db.query(
      `SELECT
        r.id,
        r.borrower_id AS "borrowerId",
        r.amt_requested AS "amtRequested",
        r.amt_approved AS "amtApproved",
        r.purpose_id AS "purposeId",
        p.title AS "purpose",
        r.app_open_date AS "appOpenDate",
        r.app_approved_date AS "appApprovedDate",
        r.app_cancelled_date AS "appCancelledDate",
        r.interest_rate AS "interestRate",
        r.term,
        r.installment_amt AS "installmentAmt",
        r.was_approved AS "wasApproved",
        r.cancellation_reason_id AS "cancellationReasonId"
      FROM cancelled_requests as "r"
      JOIN purpose AS "p" ON p.id = r.purpose_id
      WHERE r.id = $1`,
      [id]
    );
    const cancelledRequest = result.rows[0];
    if (!cancelledRequest)
      throw new NotFoundError(`No Canceleld Request exists with id: ${id}`);
    return cancelledRequest;
  }
}

module.exports = CancelledRequest;
