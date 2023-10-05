"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");

/** Class for Funded Loans */

class FundedLoan {
  /** Get all funded loans in database */
  static async getAll() {
    const result = await db.query(`
    SELECT id,
      borrower_id AS "borrowerId",
      amt_funded AS "amtFunded",
      funded_date AS "fundedDate",
      interest_rate AS "interestRate",
      term,
      installment_amt AS "installmentAmt",
      remaining_balance AS "remainingBalance"
    FROM funded_loans`);

    return result.rows;
  }

  /** Given id, get a specific funded loan from database */
  static async get(id) {
    const result = await db.query(
      `SELECT id,
        borrower_id AS "borrowerId",
        amt_funded AS "amtFunded",
        funded_date AS "fundedDate",
        interest_rate AS "interestRate",
        term,
        installment_amt AS "installmentAmt",
        remaining_balance AS "remainingBalance"
      FROM funded_loans
      WHERE id = $1`,
      [id]
    );
    const fundedLoan = result.rows[0];
    if (!fundedLoan)
      throw new NotFoundError(`Funded loan with ${id} does not exist.`);
    return fundedLoan;
  }

  /** Create funded loan */
  static async create({
    appId,
    borrowerId,
    amtFunded,
    fundedDate,
    interestRate,
    term,
    installmentAmt,
    remainingBalance,
  }) {
    const result = await db.query(
      `
      INSERT INTO funded_loans
        (id,
          borrower_id,
          amt_funded,
          funded_date,
          interest_rate,
          term,
          installment_amt,
          remaining_balance
          )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          id,
          borrower_id AS "borrowerId",
          amt_funded AS "amtFunded",
          funded_date AS "fundedDate",
          interest_rate AS "interestRate",
          term,
          installment_amt AS "installmentAmt",
          remaining_balance AS "remainingBalance"
    `,
      [
        appId,
        borrowerId,
        amtFunded,
        fundedDate,
        interestRate,
        term,
        installmentAmt,
        remainingBalance,
      ]
    );
    return result.rows[0];
  }

  /** Record loan installment received */
  static async recordInstallment(id) {
    // get loan record
    const fundedLoan = FundedLoan.get(id);
    if (!fundedLoan)
      throw new NotFoundError(`Funded loan with ${id} is not found.`);

    // calculate new remaining balance
    let interest =
      (+fundedLoan.remainingBalance * +fundedLoan.interestRate) / 12;
    interest = interest.toFixed(2);
    let principal = +fundedLoan.installmentAmt - interest;

    // if it is last payment, transfer record o paidoff_loans table and delete
    // record from funded_loans else reduce balance by payment amount
    if (fundedLoan.remainingBalance <= principal) {
      // transfer account to paidoff_loans
      // delete record
      fundedLoan.remainingBalance = 0;
      return fundedLoan;
    }
    fundedLoan.remainingBalance -= principal;

    // update record in database
    const result = await db.query(`
    UPDATE funded_loans
      SET remaining_balance = $1
      WHERE id = $2
      RETURNING
        id,
        app_id AS "appId",
        borrower_id AS "borrowerId",
        amt_funded AS "amtFunded",
        funded_date AS "fundedDate",
        interest_rate AS "interestRate",
        term,
        installment_amt AS "installmentAmt",
        remaining_balance AS "remainingBalance
    `);

    return result.rows[0];
  }
}

module.exports = FundedLoan;
