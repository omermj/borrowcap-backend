"use strict";

/** Routes for Active Loan Requests */

const express = require("express");
const jsonschema = require("jsonschema");
const newLoanSchema = require("../schemas/newLoanRequest.json");
const updateLoanSchema = require("../schemas/updateLoanRequest.json");
const approveLoanSchema = require("../schemas/approveLoanRequest.json");
const { BadRequestError } = require("../expressError");
const ActiveRequest = require("../models/activeRequest");
const User = require("../models/user");
const {
  ensureAdmin,
  ensureAuthorizedUserOrAdmin,
  ensureAuthorizedUser,
  ensureLoggedIn,
} = require("../middleware/auth");

const router = express.Router();

/** Get all activeRequests */
router.get("/", ensureAdmin, async (req, res, next) => {
  try {
    const activeRequests = await ActiveRequest.getAll();
    return res.json({ activeRequests });
  } catch (e) {
    return next(e);
  }
});

/** Given activeRequest id, return activeRequest data */
router.get("/:id", ensureAdmin, async (req, res, next) => {
  try {
    const activeRequest = await ActiveRequest.get(req.params.id);
    return res.json({ activeRequest });
  } catch (e) {
    return next(e);
  }
});

/** Get all activeRequest given BorrowerId */
router.get(
  "/users/:id",
  ensureAuthorizedUserOrAdmin,
  async (req, res, next) => {
    try {
      const activeRequests = await ActiveRequest.getByBorrowerId(req.params.id);
      return res.json({ activeRequests });
    } catch (e) {
      return next(e);
    }
  }
);

/** Create new activeRequest */
router.post("/", ensureLoggedIn, async (req, res, next) => {
  try {
    // validate req.body
    const validator = jsonschema.validate(req.body, newLoanSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      console.log(validator.errors);
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

/** Update activeRequest */
router.patch("/:id", ensureAdmin, async (req, res, next) => {
  try {
    // validate req.body
    const validator = jsonschema.validate(req.body, updateLoanSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    const activeRequest = await ActiveRequest.update(req.params.id, req.body);
    return res.json({ activeRequest });
  } catch (e) {
    return next(e);
  }
});

/** Delete activeRequest */
router.delete("/:id", ensureAdmin, async (req, res, next) => {
  try {
    const result = ActiveRequest.delete(req.params.id);
    if (result) {
      return res.json({
        message: `Deleted Active Request with id: ${req.params.id}`,
      });
    }
  } catch (e) {
    return next(e);
  }
});

/** Approve activeRequest (Underwriter only) */
router.patch("/:id/approve", ensureAdmin, async (req, res, next) => {
  try {
    // validate JSON request data (interest rate and approved amt)
    const validator = jsonschema.validate(req.body, approveLoanSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    const approvedRequest = await ActiveRequest.approve(
      req.params.id,
      req.body
    );
    return res.status(201).json({ approvedRequest });
  } catch (e) {
    return next(e);
  }
});

/** Reject activeRequest (Underwriter only) */
router.patch("/:id/reject", ensureAdmin, async (req, res, next) => {
  try {
    const rejectedRequest = await ActiveRequest.reject(req.params.id);
    if (rejectedRequest)
      return res.json({ message: "Active Request is rejected." });
    else return res.json({ message: "Approved Request was not rejected." });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
