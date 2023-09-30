"use strict";

const db = require("../db");
const CancelledRequest = require("./cancelledRequest");
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

  /** Get Approved Request from databas given id */
  static async get(id) {
    const result = await db.query(
      `
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
      FROM approved_requests
      WHERE id = $1
    `,
      [id]
    );
    const approvedRequest = result.rows[0];
    if (!approvedRequest)
      throw new NotFoundError(`No Approved Request exists with id: ${id}`);
    return approvedRequest;
  }

  /** Create Approved Request */
  static async create({
    id,
    borrowerId,
    amtRequested,
    amtApproved,
    amtFunded,
    purposeId,
    income,
    otherDebt,
    appOpenDate,
    appApprovedDate,
    fundingDeadline,
    interestRate,
    term,
    installmentAmt,
    availableForFunding,
    isFunded,
  }) {
    try {
      const result = await db.query(
        `
        INSERT INTO approved_requests
        (id,
          borrower_id,
          amt_requested,
          amt_approved,
          amt_funded,
          purpose_id,
          income,
          other_debt,
          app_open_date,
          app_approved_date,
          funding_deadline,
          interest_rate,
          term,
          installment_amt,
          available_for_funding,
          is_funded)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING
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
      `,
        [
          id,
          borrowerId,
          amtRequested,
          amtApproved,
          amtFunded,
          purposeId,
          income,
          otherDebt,
          appOpenDate,
          appApprovedDate,
          fundingDeadline,
          interestRate,
          term,
          installmentAmt,
          availableForFunding,
          isFunded,
        ]
      );
      return result.rows[0];
    } catch (e) {
      throw new ExpressError(`Database error: ${e}`);
    }
  }

  /** Cancel approved request */
  static async cancel(id, cancellationReasonId) {
    // retrieve app from database
    const approvedRequest = await ApprovedRequest.get(id);
    if (!approvedRequest)
      throw new NotFoundError(`No Approved Request exists with id: ${id}`);

    // Get date
    const date = new Date().toUTCString();

    // Create entry in cancelled_requests table
    const cancelledApp = await CancelledRequest.create({
      ...approvedRequest,
      appCancelledDate: date,
      wasApproved: true,
      cancellationReasonId,
    });

    // Delete approved request from approved_requests table
    if (cancelledApp) {
      ApprovedRequest.delete(id);
      return true;
    } else return false;
  }

  /** Enable funding for Approved Request */
  static async enableFunding(id) {
    const result = await db.query(
      `
      UPDATE approved_requests
        SET available_for_funding = $1
        WHERE id = $2
        RETURNING id
    `,
      [true, id]
    );

    const appId = result.rows[0];
    if (!appId)
      throw new NotFoundError(`No Approved Request exists with id: ${id}`);
    return true;
  }

  /** Delete Approved Request */
  static async delete(id) {
    const result = await db.query(
      `
  DELETE
    FROM approved_requests
    WHERE id = $1
    RETURNING id`,
      [id]
    );
    const appId = result.rows[0];
    if (!appId)
      throw new NotFoundError(`No Approved Request exists with id: ${id}`);
    return true;
  }
}

module.exports = ApprovedRequest;
