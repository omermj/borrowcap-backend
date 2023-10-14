"use strict";

/** Routes for Purposes */

const express = require("express");
const { BadRequestError, NotFoundError } = require("../expressError");
const Purpose = require("../models/purpose");

const router = express.Router();

/** Get all purposes */
router.get("/", async (req, res, next) => {
  try {
    const purposes = await Purpose.getAll();
    return res.json({ purposes });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
