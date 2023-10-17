"use strict";

/** Routes for Terms */

const express = require("express");
const { BadRequestError, NotFoundError } = require("../expressError");
const Term = require("../models/term");

const router = express.Router();

/** Get all roles */
router.get("/", async (req, res, next) => {
  try {
    const terms = await Term.getAll();
    return res.json({ terms });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
