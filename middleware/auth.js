"use strict";

/** Middleware to handle auth in routes */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const ApprovedRequest = require("../models/approvedRequest");
const User = require("../models/user");

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

function ensureAdmin(req, res, next) {
  try {
    if (!res.locals.user || !res.locals.user.isAdmin)
      throw new UnauthorizedError("User is not admin");
    return next();
  } catch (e) {
    return next(e);
  }
}

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

async function isCorrectBorrower(userId, appId) {
  try {
    const approvedRequest = await ApprovedRequest.get(appId);
    if (+approvedRequest.borrowerId !== +userId) return false;
    return true;
  } catch (e) {
    return false;
  }
}

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

async function isInvestor(userId) {
  try {
    const user = await User.get(userId);
    if (!user.roles.includes("investor")) return false;
    return true;
  } catch (e) {
    return false;
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
};
