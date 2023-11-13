"use strict";

/** Routes for Active Loan Requests */

const express = require("express");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../expressError");
const ApprovedRequest = require("../models/approvedRequest");
const User = require("../models/user");
const {
  ensureAdmin,
  ensureAuthorizedUserOrAdmin,
  ensureAuthorizedUser,
  ensureLoggedIn,
  ensureCorrectBorrower,
  ensureAdminOrCorrectBorrower,
} = require("../middleware/auth");

const router = express.Router();

/** Get all approved requests */
router.get("/", ensureAdmin, async (req, res, next) => {
  try {
    const approvedRequests = await ApprovedRequest.getAll();
    return res.json({ approvedRequests });
  } catch (e) {
    return next(e);
  }
});

/** Get all approved requests which are available for investment */
router.get("/available", ensureLoggedIn, async (req, res, next) => {
  try {
    const availableInvestments =
      await ApprovedRequest.getAvailableForInvestment();
    return res.json({ availableInvestments });
  } catch (e) {
    return next(e);
  }
});

/** Given id, return approved request data */
router.get("/:appId", ensureAdmin, async (req, res, next) => {
  try {
    const approvedRequest = await ApprovedRequest.get(req.params.appId);
    return res.json({ approvedRequest });
  } catch (e) {
    return next(e);
  }
});

/** Given id, cancel approved request */
router.delete("/:appId/cancel", async (req, res, next) => {
  try {
    await ensureAdminOrCorrectBorrower(req, res, next);

    const cancelledRequest = await ApprovedRequest.cancel(req.params.appId, 3);
    return res.json({ message: cancelledRequest });
  } catch (e) {
    return next(e);
  }
});

/** Given id, enable funding to approved request */
router.patch("/:appId/enablefunding", async (req, res, next) => {
  try {
    await ensureCorrectBorrower(req, res, next);

    const result = await ApprovedRequest.enableFunding(req.params.appId);
    return res.json({ message: "Funding enabled." });
  } catch (e) {
    return next(e);
  }
});

/** Add funding pledge to an approved request */
router.patch("/:appId/fund", ensureLoggedIn, async (req, res, next) => {
  try {
    if (!req.body.amount) throw new BadRequestError("Amount is required");

    const user = await User.get(res.locals.user.id);
    if (!user.roles.includes("investor")) throw new UnauthorizedError();

    const approvedRequest = await ApprovedRequest.fund(
      req.params.appId,
      user.id,
      req.body.amount
    );
    if (!approvedRequest)
      throw new NotFoundError(
        `Approved Request with id ${req.params.appId} does not exist.`
      );
    return res.json({ approvedRequest });
  } catch (e) {
    return next(e);
  }
});

/** Get Approved Requests for User */
router.get(
  "/users/:userId",
  ensureAuthorizedUserOrAdmin,
  async (req, res, next) => {
    try {
      const approvedRequests =
        await ApprovedRequest.getApprovedRequestsByUserId(req.params.userId);
      return res.json({ approvedRequests });
    } catch (e) {
      return next(e);
    }
  }
);

module.exports = router;
