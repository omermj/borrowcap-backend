"use strict";

const db = require("../db");
const {
  NotFoundError,
  ExpressError,
  BadRequestError,
} = require("../expressError");
const User = require("../models/user");

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
  static async payInstallment(id) {
    // get loan record
    const fundedLoan = await FundedLoan.get(id);
    if (!fundedLoan)
      throw new NotFoundError(`Funded loan with ${id} is not found.`);

    // check if borrower has sufficient funds
    const borrower = await User.get(fundedLoan.borrowerId);
    if (+borrower.accountBalance < +fundedLoan.installmentAmt)
      throw new BadRequestError(
        "Borrower does not have enough funds to pay installment"
      );

    // calculate new remaining balance
    let interest =
      (+fundedLoan.remainingBalance * +fundedLoan.interestRate) / 12;
    interest = interest.toFixed(2);
    let principal = +fundedLoan.installmentAmt - interest;

    // if it is last payment, transfer record to paidoff_loans table and delete
    // record from funded_loans else reduce balance by payment amount
    if (fundedLoan.remainingBalance <= principal) {
      await FundedLoan.payoffLoan(id);
      return fundedLoan;
    }

    // else reduce the balance and update the database
    fundedLoan.remainingBalance -= principal;

    // update record in database
    const result = await db.query(
      `
    UPDATE funded_loans
      SET remaining_balance = $1
      WHERE id = $2
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
      [fundedLoan.remainingBalance, fundedLoan.id]
    );

    // update borrower account balance
    await User.withdrawFunds(fundedLoan.borrowerId, fundedLoan.installmentAmt);

    // update investor account balance
    await FundedLoan.updateInvestorsBalanceForInstallment(id);

    return result.rows[0];
  }

  /** Payoff Loan by transferring the record from fundedLoans to paidoffLoans */
  static async payoffLoan(id) {
    // get loan record
    const fundedLoan = await FundedLoan.get(id);
    if (!fundedLoan)
      throw new NotFoundError(`Funded loan with ${id} is not found.`);

    // Get paidoff date
    const paidoffDate = new Date().toUTCString();

    // create record in paidoff_loans table
    const resultPaidoffLoan = await db.query(
      `
      INSERT INTO paidoff_loans
        (id,
        borrower_id,
        amt_funded,
        funded_date,
        paidoff_date,
        interest_rate,
        term,
        installment_amt)  
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        borrower_id AS "borrowerId",
        amt_funded AS "amtFunded",
        funded_date AS "fundedDate",
        paidoff_date AS "paidoffDate",
        interest_rate AS "interestRate",
        term,
        installment_amt AS "installmentAmt"
    `,
      [
        fundedLoan.id,
        fundedLoan.borrowerId,
        fundedLoan.amtFunded,
        fundedLoan.fundedDate,
        paidoffDate,
        fundedLoan.interestRate,
        fundedLoan.term,
        fundedLoan.installmentAmt,
      ]
    );

    const paidoffLoan = resultPaidoffLoan.rows[0];

    // Delete record from funded_loans table
    if (!!paidoffLoan) {
      const resultFundedLoan = await db.query(
        `
        DELETE FROM funded_loans
          WHERE id = $1
      `,
        [id]
      );
      return paidoffLoan;
    } else {
      throw new ExpressError("Error updating database for paidoff loan");
    }
  }

  /** Update investor(s) balance for installment received */
  static async updateInvestorsBalanceForInstallment(loan_id) {
    // get the funded loan
    const fundedLoan = await FundedLoan.get(loan_id);
    if (!fundedLoan)
      throw new NotFoundError(`Funded loan with ${id} is not found.`);

    // get all investors and investedAmts
    const result = await db.query(
      `
      SELECT investor_id AS "investorId", invested_amt AS "investedAmt"
        FROM funded_loans_investors
        WHERE loan_id = $1
    `,
      [loan_id]
    );
    const investedAmts = result.rows;
    if (!investedAmts) throw new ExpressError("Error recording installment");

    // iterate through investors and deposit relevant amounts in their balances
    investedAmts.map(async (investment) => {
      const amtToDeposit =
        (+investment.investedAmt / +fundedLoan.amtFunded) *
        +fundedLoan.installmentAmt;
      await User.depositFunds(investment.investorId, amtToDeposit);
    });
  }
}

module.exports = FundedLoan;
