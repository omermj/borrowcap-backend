"use strict";

/** Middleware to handle auth in routes */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const ApprovedRequest = require("../models/approvedRequest");
const User = require("../models/user");

/** Authenticate JWT: Verify token in req header and place it in res  */
function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim(); // extracts token from header
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (e) {
    return next();
  }
}

/** Check if user is logged in  */
function ensureLoggedIn(req, res, next) {
  try {
    const user = res.locals.user;
    if (!user) {
      throw new UnauthorizedError("User is not logged in");
    }
    return next();
  } catch (e) {
    return next(e);
  }
}

/** Check if a user is admin */
function ensureAdmin(req, res, next) {
  try {
    if (!res.locals.user || !res.locals.user.isAdmin)
      throw new UnauthorizedError("User is not admin");
    return next();
  } catch (e) {
    return next(e);
  }
}

/** Check if user is admin or is logged in */
function ensureAdminOrLoggedIn(req, res, next) {
  try {
    const user = res.locals.user;

    if (
      !user ||
      (!user.isAdmin &&
        +req.params.id !== user.id &&
        +req.params.userId !== user.id &&
        req.params.username !== user.username)
    ) {
      throw new UnauthorizedError();
    }

    return next();
  } catch (e) {
    return next(e);
  }
}

/** Check if user is a correct borrower */
async function isCorrectBorrower(userId, appId) {
  try {
    const approvedRequest = await ApprovedRequest.get(appId);
    if (+approvedRequest.borrowerId !== +userId) return false;
    return true;
  } catch (e) {
    return false;
  }
}

/** Check if user is a correct investor */
async function isCorrectInvestor(userId, appId) {
  try {
    const approvedRequests = await ApprovedRequest.getApprovedRequestsByUserId(
      userId
    );
    const approvedRequest = approvedRequests.investor.find(
      (app) => app.id === +appId
    );
    if (!approvedRequest) return false;
    return true;
  } catch (e) {
    return false;
  }
}

/** Check if user is an investor */
async function isInvestor(userId) {
  try {
    const user = await User.get(userId);
    if (!user.roles.includes("investor")) return false;
    return true;
  } catch (e) {
    return false;
  }
}

/** Ensure correct user (logged in user is same as user id in params) */
function ensureCorrectUser(req, res, next) {
  const user = res.locals.user;
  try {
    if (!user || +user.id !== +req.params.id)
      throw new UnauthorizedError("Incorrect User");
    return next();
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  authenticateJWT,
  ensureAdmin,
  ensureAdminOrLoggedIn,
  ensureLoggedIn,
  isCorrectBorrower,
  isCorrectInvestor,
  isInvestor,
  ensureCorrectUser,
};
