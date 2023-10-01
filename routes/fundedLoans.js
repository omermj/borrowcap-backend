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
    const result = await FundedLoan.get(req.params.id);
    const fundedLoan = result.rows[0];
    if (!fundedLoan)
      throw new NotFoundError(`Funded loan with ${id} is not found.`);
    return res.json({ fundedLoan });
  } catch (e) {
    return next(e);
  }
});

