"use strict";

/** Routes for Roles */

const express = require("express");
const { BadRequestError, NotFoundError } = require("../expressError");
const Role = require("../models/role");

const router = express.Router();

/** Get all roles */
router.get("/", async (req, res, next) => {
  try {
    const roles = await Role.getAll();
    return res.json({ roles });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
