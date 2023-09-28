"use strict";

/** Routes for Active Loan Requests */

const express = require("express");
const jsonschema = require("jsonschema");
const newLoanSchema = require("../schemas/newLoanRequest.json");
const { BadRequestError } = require("../expressError");
const ActiveRequest = require("../models/activeRequest");
const User = require("../models/user");

const router = express.Router();

/** Get all loans */

router.get("/", async (req, res, next) => {
  try {
    const loanRequests = await ActiveRequest.getAll();
    return res.json({ loanRequests });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    // validate req.body
    const validator = jsonschema.validate(req.body, newLoanSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    // check if userId(borrowerId) has borrower role
    const roles = await User.getRoles(req.body.borrowerId);
    if (!roles.includes("borrower"))
      throw new BadRequestError("User is not registered as a borrower");

    const loanRequest = await ActiveRequest.create(req.body);
    return res.status(201).json({ loanRequest });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
