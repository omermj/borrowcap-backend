"use strict";

/** Middleware to handle auth in routes */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");

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

function ensureAuthorizedUser(req, res, next) {
  try {
    const user = res.locals.user;
    if (
      !user ||
      req.params.username !== user.id ||
      req.params.username !== user.id
    )
      throw new UnauthorizedError();
    return next();
  } catch (e) {
    return next(e);
  }
}

function ensureLoggedIn(req, res, next) {
  try {
    const user = res.locals.user;
    if (!user) throw new UnauthorizedError();
  } catch (e) {
    return next(e);
  }
}

function ensureAdmin(req, res, next) {
  try {
    if (!res.locals.user || !res.locals.user.isAdmin)
      throw new UnauthorizedError();
    return next();
  } catch (e) {
    return next(e);
  }
}

function ensureAuthorizedUserOrAdmin(req, res, next) {
  try {
    const user = res.locals.user;

    // if (!user) throw new UnauthorizedError();
    // if (user.isAdmin) return next();
    // if (+req.params.id !== user.id && req.params.username !== user.username) {
    //   throw new UnauthorizedError();
    // }

    if (
      !user ||
      (!user.isAdmin &&
        +req.params.id !== user.id &&
        req.params.username !== user.username)
    ) {
      throw new UnauthorizedError();
    }

    return next();
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  authenticateJWT,
  ensureAuthorizedUser,
  ensureAdmin,
  ensureAuthorizedUserOrAdmin,
  ensureLoggedIn,
};
