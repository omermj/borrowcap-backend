"use strict";

/** Routes for authentication */

const express = require("express");
const jsonschema = require("jsonschema");
const userLoginSchema = require("../schemas/userLogin.json");
const userAddSchema = require("../schemas/userAdd.json");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");

const router = express.Router();

/** Login / Token */

router.post("/token", async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, userLoginSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    const { username, password } = req.body;
    const user = await User.authenticate(username, password);
    const token = createToken(user);
    return res.json({ user, token });
  } catch (e) {
    return next(e);
  }
});

/** Register User */

router.post("/register", async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, userAddSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    const newUser = await User.add({ ...req.body });
    const token = createToken(newUser);
    return res.status(201).json({ token });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
