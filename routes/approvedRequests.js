"use strict";

/** Routes for Active Loan Requests */

const express = require("express");
const jsonschema = require("jsonschema");
const { BadRequestError } = require("../expressError");
const ApprovedRequest = require("../models/approvedRequest");
const User = require("../models/user");

const router = express.Router();

/** Get all loans */
router.get("/", async (req, res, next) => {
  try {
    const approvedRequests = await ApprovedRequest.getAll();
    return res.json({ approvedRequests });
  } catch (e) {
    return next(e);
  }
});

/** Given id, return approved request data */
router.get("/:id", async (req, res, next) => {
  try {
    const approvedRequest = await ApprovedRequest.get(req.params.id);
    return res.json({ approvedRequest });
  } catch (e) {
    return next(e);
  }
});

/** Given id, cancel approved request */
router.patch("/:id/cancel", async (req, res, next) => {
  try {
    const cancelledRequest = await ApprovedRequest.cancel(req.params.id, 1);
    if (cancelledRequest)
      return res.json({ message: "Approved Request is cancelled." });
    else return res.json({ message: "Approved Request was not cancelled." });
  } catch (e) {
    return next(e);
  }
});

/** Given id, enable funding to approved request */
router.patch("/:id/enablefunding", async (req, res, next) => {
  try {
    const result = await ApprovedRequest.enableFunding(req.params.id);
    return res.json({ message: "Funding enabled." });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
