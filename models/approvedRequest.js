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
const FundedLoan = require("./fundedLoan");

/** Database Model: Approved Loan Requests */

class ApprovedRequest {
  /** Get all Approved Requests from database */
  static async getAll() {
    const result = await db.query(`
      SELECT 
        r.id,
        r.borrower_id AS "borrowerId",
        r.amt_requested AS "amtRequested",
        r.amt_approved AS "amtApproved",
        r.amt_funded AS "amtFunded",
        p.title AS "purpose",
        p.id AS "purposeId",
        r.app_open_date AS "appOpenDate",
        r.app_approved_date AS "appApprovedDate",
        r.funding_deadline AS "fundingDeadline",
        r.interest_rate AS "interestRate",
        r.term,
        r.installment_amt AS "installmentAmt",
        r.available_for_funding AS "availableForFunding",
        r.is_funded AS "isFunded"
      FROM approved_requests AS "r"
      LEFT JOIN purpose AS "p" ON p.id = r.purpose_id
      ORDER BY r.id
      `);
    return result.rows;
  }

  /** Get Approved Request from databas given id */
  static async get(id) {
    const result = await db.query(
      `
      SELECT 
        r.id,
        r.borrower_id AS "borrowerId",
        r.amt_requested AS "amtRequested",
        r.amt_approved AS "amtApproved",
        r.amt_funded AS "amtFunded",
        p.title AS "purpose",
        r.app_open_date AS "appOpenDate",
        r.app_approved_date AS "appApprovedDate",
        r.funding_deadline AS "fundingDeadline",
        r.interest_rate AS "interestRate",
        r.term,
        r.installment_amt AS "installmentAmt",
        r.available_for_funding AS "availableForFunding",
        r.is_funded AS "isFunded"
      FROM approved_requests AS "r"
      JOIN purpose AS "p" ON p.id = r.purpose_id
      WHERE r.id = $1
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
          app_open_date,
          app_approved_date,
          funding_deadline,
          interest_rate,
          term,
          installment_amt,
          available_for_funding,
          is_funded)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING
          id,
          borrower_id AS "borrowerId",
          amt_requested AS "amtRequested",
          amt_approved AS "amtApproved",
          amt_funded AS "amtFunded",
          purpose_id AS "purposeId",
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

  /** Update Approved Request */
  static async update(id, data) {
    // generate SQL query
    const { cols, values } = generateUpdateQuery(data, {
      amtFunded: "amt_funded",
      installmentAmt: "installment_amt",
      availableForFunding: "available_for_funding",
      isFunded: "is_funded",
    });

    const sqlQuery = `
    UPDATE approved_requests
    SET ${cols}
    WHERE id = $${values.length + 1}
    RETURNING
      id,
      borrower_id AS "borrowerId",
      amt_requested AS "amtRequested",
      amt_approved AS "amtApproved",
      amt_funded AS "amtFunded",
      purpose_id AS "purposeId",
      app_open_date AS "appOpenDate",
      app_approved_date AS "appApprovedDate",
      funding_deadline AS "fundingDeadline",
      interest_rate AS "interestRate",
      term,
      installment_amt AS "installmentAmt",
      available_for_funding AS "availableForFunding",
      is_funded AS "isFunded"
    `;

    const result = await db.query(sqlQuery, [...values, id]);
    const approvedRequest = result.rows[0];

    if (!approvedRequest)
      throw new NotFoundError(`No Approved Request exists with id: ${id}`);

    return approvedRequest;
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

  /** Fund Approved Request */
  static async fund(appId, investorId, amount) {
    // get approved request
    const approvedRequest = await ApprovedRequest.get(appId);

    // check if request is available for funding
    if (!approvedRequest.availableForFunding)
      throw new ExpressError(
        `Approved request with id of ${appId} is not available for funding.`
      );

    // get remaining funding amount
    const remainingFundingAmount =
      +approvedRequest.amtApproved - approvedRequest.amtFunded;

    // if remaining funding amount is greater than amount of funding being
    // requested, throw an error
    if (amount > remainingFundingAmount)
      throw new ExpressError(
        "Amount of funding request must be lower or equal to remaining funding amount"
      );

    // if funding amount is equal to remaining amount, fully fund the request
    if (amount === remainingFundingAmount) {
      // set is_funded to true (fully funded) & set availableForFunding to false
      const updatedApprovedRequest = await ApprovedRequest.update(appId, {
        amtFunded: approvedRequest.amtApproved,
        isFunded: true,
        availableForFunding: false,
      });

      // Updated Approved Request and Investor relation for pledged amount
      const updatePledgeResult =
        await ApprovedRequest.updateRequestInvestorRelation(
          appId,
          investorId,
          amount
        );

      // Create fundedLoan entry
      updatedApprovedRequest.appId = updatedApprovedRequest.id;
      updatedApprovedRequest.fundedDate = new Date().toUTCString();
      updatedApprovedRequest.amtFunded = updatedApprovedRequest.amtApproved;
      updatedApprovedRequest.remainingBalance =
        updatedApprovedRequest.amtApproved;

      const fundedLoan = await FundedLoan.create({
        ...updatedApprovedRequest,
      });
      const updateInvestorRelation =
        await ApprovedRequest.updateFundedLoanInvestorRelation(appId);

      // Remove relationship between approved_request and investors as request is
      // funded
      ApprovedRequest.removeRelationApprovedRequestInvestors(appId);

      return updatedApprovedRequest;
    }

    // if amount is less than remaining amount, update the Active Request entry
    if (amount < remainingFundingAmount) {
      const updatedApprovedRequest = await ApprovedRequest.update(appId, {
        amtFunded: +approvedRequest.amtFunded + amount,
      });

      // Updated Approved Request and Investor relation for pledged amount
      const updatePledgeResult =
        await ApprovedRequest.updateRequestInvestorRelation(
          appId,
          investorId,
          amount
        );
      return updatedApprovedRequest;
    }
  }

  /** Update the relation between Approved Requests and Investor tables
   *  to mark investment pledged by investor
   */
  static async updateRequestInvestorRelation(appId, investorId, amount) {
    const result = await db.query(
      `
      INSERT INTO approved_requests_investors
        (request_id, investor_id, pledged_amt)
        VALUES ($1, $2, $3)
        RETURNING
          request_id AS "requestId",
          investor_id AS "investorId",
          pledged_amt AS "pledgedAmt"     
    `,
      [appId, investorId, amount]
    );
    if (!result.rows[0]) throw new ExpressError("Error updating database");
    return result.rows[0];
  }

  /** Update the relation between Funded Loans and Investor tables
   *  to mark investment by investor
   */
  static async updateFundedLoanInvestorRelation(loanId) {
    const result = await db.query(
      `
      INSERT INTO funded_loans_investors (loan_id, investor_id, invested_amt)
      SELECT request_id, investor_id, pledged_amt
      FROM approved_requests_investors
      WHERE request_id = $1
      `,
      [loanId]
    );
  }

  static async removeRelationApprovedRequestInvestors(appId) {
    const result = await db.query(
      `
      DELETE
        FROM approved_requests_investors
        WHERE request_id = $1
        RETURNING request_id
    `,
      [appId]
    );
    const id = result.rows[0];
    if (!id) new NotFoundError(`No request with id: ${appId}`);
  }
}

module.exports = ApprovedRequest;
