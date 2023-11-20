"use strict";

/** Routes for Funded Loans */

const express = require("express");
const FundedLoan = require("../models/fundedLoan");
const {
  ensureAdmin,
  ensureLoggedIn,
  ensureCorrectUser,
} = require("../middleware/auth");

const router = express.Router();

/** Get all funded loans */
router.get("/", ensureAdmin, async (req, res, next) => {
  try {
    const fundedLoans = await FundedLoan.getAll();
    return res.json({ fundedLoans });
  } catch (e) {
    return next(e);
  }
});

/** Given id, get specific funded loan */
router.get("/:appId", ensureLoggedIn, async (req, res, next) => {
  try {
    const fundedLoan = await FundedLoan.get(req.params.appId);
    return res.json({ fundedLoan });
  } catch (e) {
    return next(e);
  }
});

/** Given id, pay installment of a funded loan */
router.patch(
  "/:appId/payinstallment",
  ensureLoggedIn,
  async (req, res, next) => {
    try {
      const fundedLoan = await FundedLoan.payInstallment(req.params.appId);
      return res.json({ fundedLoan });
    } catch (e) {
      return next(e);
    }
  }
);

/** Get Funded Loans for User (Borrower and Investor) */
router.get("/:appId/users", ensureLoggedIn, async (req, res, next) => {
  try {
    const fundedLoans = await FundedLoan.getFundedLoansByUserId(
      req.params.appId
    );
    return res.json({ fundedLoans });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
