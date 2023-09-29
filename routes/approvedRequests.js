"use strict";

/** Routes for Active Loan Requests */

const express = require("express");
const jsonschema = require("jsonschema");
const { BadRequestError } = require("../expressError");
const ApprovedRequest = require("../models/approvedRequest");
const User = require("../models/user");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const approvedRequests = await ApprovedRequest.getAll();
    return res.json({ approvedRequests });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
