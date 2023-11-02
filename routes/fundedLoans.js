"use strict";

/** Routes for Funded Loans */

const express = require("express");
const jsonschema = require("jsonschema");
const { BadRequestError, NotFoundError } = require("../expressError");
const FundedLoan = require("../models/fundedLoan");

const router = express.Router();

/** Get all funded loans */
router.get("/", async (req, res, next) => {
  try {
    const fundedLoans = await FundedLoan.getAll();
    return res.json({ fundedLoans });
  } catch (e) {
    return next(e);
  }
});

/** Given id, get specific funded loan */
router.get("/:id", async (req, res, next) => {
  try {
    const fundedLoan = await FundedLoan.get(req.params.id);
    return res.json({ fundedLoan });
  } catch (e) {
    return next(e);
  }
});

/** Given id, pay installment of a funded loan */
router.patch("/pay/:id", async (req, res, next) => {
  try {
    const fundedLoan = await FundedLoan.payInstallment(req.params.id);
    return res.json({ fundedLoan });
  } catch (e) {
    return next(e);
  }
});

/** Get Funded Loans for User (Borrower and Investor) */
router.get("/users/:id", async (req, res, next) => {
  try {
    const fundedLoans = await FundedLoan.getFundedLoansByUserId(req.params.id);
    return res.json({ fundedLoans });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
