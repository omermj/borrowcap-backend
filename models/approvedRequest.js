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
const User = require("./user");
const { DatabaseError } = require("pg");

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

  /** Get Approved Request from database given id */
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
        p.id AS "purposeId",
        r.app_open_date AS "appOpenDate",
        r.app_approved_date AS "appApprovedDate",
        r.funding_deadline AS "fundingDeadline",
        r.interest_rate AS "interestRate",
        r.term,
        r.installment_amt AS "installmentAmt",
        r.available_for_funding AS "availableForFunding",
        r.is_funded AS "isFunded",
        u.annual_income AS "annualIncome",
        u.other_monthly_debt AS "otherMonthlyDebt"
      FROM approved_requests AS "r"
      JOIN purpose AS "p" ON p.id = r.purpose_id
      JOIN users AS "u" ON u.id = r.borrower_id
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
      throw new BadRequestError();
    }
  }

  /** Update Approved Request */
  static async update(id, data) {
    // generate SQL query
    const { cols, values } = generateUpdateQuery(data, {
      amtFunded: "amt_funded",
      amtRequested: "amt_requested",
      amtApproved: "amtApproved",
      purposeId: "purpose_id",
      appOpenDate: "app_open_date",
      appApprovedDate: "app_approved_date",
      fundingDeadline: "funding_deadline",
      installmentAmt: "installment_amt",
      availableForFunding: "available_for_funding",
      isFunded: "is_funded",
      interestRate: "interest_rate",
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
    // get approved request and investor data
    const approvedRequest = await ApprovedRequest.get(appId);
    const investor = await User.get(investorId);

    // throw error if approvedRequest is not available for funding
    if (!approvedRequest.availableForFunding)
      throw new ExpressError(
        `Approved request with id of ${appId} is not available for funding.`
      );

    // throw error if amtAvailableToFund < amount
    const amtAvailableToFund =
      +approvedRequest.amtApproved - approvedRequest.amtFunded;
    if (amount > amtAvailableToFund)
      throw new ExpressError(
        "Amount of funding request must be lower or equal to remaining funding amount"
      );

    // throw error if investor funds are insufficient
    if (investor.accountBalance < amount)
      throw new BadRequestError("Investor does not have enough accountBalance");

    // update approvedRequest entry with funding information
    let updatedApprovedRequest = await ApprovedRequest.update(appId, {
      amtFunded: +approvedRequest.amtFunded + amount,
    });

    // add investor pledge in database
    await ApprovedRequest.addInvestorPledge(appId, investorId, amount);

    // reduce investor balance by amount of pledge
    await User.withdrawFunds(investor.id, amount);

    // if approvedRequest is fully funded, create fundedLoan
    if (amount === amtAvailableToFund) {
      // set is_funded to true (fully funded) & set availableForFunding to false
      updatedApprovedRequest = await ApprovedRequest.update(appId, {
        isFunded: true,
        availableForFunding: false,
      });
      // create fundedLoan
      const fundedLoan = await FundedLoan.create(updatedApprovedRequest);

      // Remove relation between approved_request & investors as request is funded
      ApprovedRequest.removeRelationApprovedRequestInvestors(appId);
    }

    return updatedApprovedRequest;
  }

  /** Update the relation between Approved Requests and Investor tables
   *  to mark investment pledged by investor
   */
  static async addInvestorPledge(appId, investorId, amount) {
    const approvedRequest = await ApprovedRequest.get(appId);
    if (!approvedRequest) throw new NotFoundError("Incorrect app id");

    const investor = await User.get(investorId);
    if (!investor) throw new NotFoundError("Incorrect investor id");

    // check if investor has already pledged for the request
    const existingPledge = await db.query(
      `
      SELECT * FROM approved_requests_investors
      WHERE request_id = $1 AND investor_id = $2
      `,
      [appId, investorId]
    );
    // if already pledged, update the pledge amount
    if (existingPledge.rows[0]) {
      const newPledgedAmt = +existingPledge.rows[0].pledged_amt + amount;
      const result = await db.query(
        `
        UPDATE approved_requests_investors
        SET pledged_amt = $1
        WHERE request_id = $2 AND investor_id = $3
        RETURNING
          request_id AS "requestId",
          investor_id AS "investorId",
          pledged_amt AS "pledgedAmt"
        `,
        [newPledgedAmt, appId, investorId]
      );
      if (!result.rows[0]) throw new ExpressError("Error updating database");
      return result.rows[0];
    } else {
      // add investor pledge in database if not already pledged
      const result = await db.query(
        `INSERT INTO approved_requests_investors
        (request_id, investor_id, pledged_amt)
        VALUES ($1, $2, $3)
        RETURNING
          request_id AS "requestId",
          investor_id AS "investorId",
          pledged_amt AS "pledgedAmt"`,
        [appId, investorId, amount]
      );
      if (!result.rows[0]) throw new ExpressError("Error updating database");
      return result.rows[0];
    }
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

  /** Get Approved Requests which are available for investment */
  static async getAvailableForInvestment() {
    const result = await db.query(
      `SELECT r.id,
        r.amt_approved AS "amtApproved",
        r.amt_funded AS "amtFunded",
        p.title AS "purpose",
        r.app_approved_date AS "approvedDate",
        r.funding_deadline AS "fundingDeadline",
        r.interest_rate AS "interestRate",
        r.term
      FROM approved_requests AS "r"
      JOIN purpose AS "p" ON p.id = r.purpose_id
      WHERE r.available_for_funding = $1 AND r.is_funded = $2`,
      [true, false]
    );
    return result.rows;
  }

  /** Get Approved Requests for a given UserId
   * - Approved Request for Borrower
   * - Pledged Investment for Investor
   */
  static async getApprovedRequestsByUserId(id) {
    // Check if User Id exists
    const user = await User.get(id);
    if (!user) throw new NotFoundError(`No user with id: ${id}`);

    // Add condition to check if user is both borrower or investor when
    // multi-role feature is implemented

    // if borrower
    if (user.roles.includes("borrower")) {
      const result = await db.query(
        `SELECT 
          r.id,
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
          r.available_for_funding AS "availableForFunding"
        FROM approved_requests AS "r"
        JOIN purpose AS "p" ON p.id = r.purpose_id
        WHERE r.borrower_id = $1 AND r.is_funded = $2`,
        [id, false]
      );
      return { borrower: result.rows };
    }
    // if investor
    else if (user.roles.includes("investor")) {
      const result = await db.query(
        `SELECT
          r.id AS "id",
          r.amt_approved AS "amtApproved",
          i.pledged_amt AS "amtPledged",
          r.app_approved_date AS "approvedDate",
          r.funding_deadline AS "fundingDeadline",
          r.interest_rate AS "interestRate",
          r.term AS "term"
        FROM approved_requests AS "r"
        JOIN approved_requests_investors AS "i" ON i.request_id = r.id
        WHERE i.investor_id = $1`,
        [id]
      );
      return { investor: result.rows };
    }
    // not investor or borrower
    else {
      throw new BadRequestError("Incorrect user role");
    }
  }
}

module.exports = ApprovedRequest;
