"use strict";

/** Routes for Active Loan Requests */

const express = require("express");
const { BadRequestError, NotFoundError } = require("../expressError");
const CancelledRequest = require("../models/cancelledRequest");
const {
  ensureAdmin,
  ensureAdminOrLoggedIn,
  ensureAuthorizedUser,
  ensureLoggedIn,
} = require("../middleware/auth");

const router = express.Router();

/** Get all cancelled requests */
router.get("/", async (req, res, next) => {
  try {
    const cancelledRequests = await CancelledRequest.getAll();
    return res.json({ cancelledRequests });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
