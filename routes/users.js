const express = require("express");
const User = require("../models/user");
const jsonschema = require("jsonschema");
const userAddSchema = require("../schemas/userAdd.json");
const { BadRequestError } = require("../expressError");
const {
  ensureAdmin,
  correctUserOrAdmin,
  ensureLoggedIn,
} = require("../middleware/auth");

const router = express.Router();
//ensureAdmin
router.get("/", async (req, res, next) => {
  try {
    const users = await User.getAll();
    return res.json({ users });
  } catch (e) {
    return next(e);
  }
});

/** Add new user in database. Only for admins. */
//ensureAdmin
router.post("/", async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, userAddSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    const user = await User.add(req.body);
    return res.status(201).json({ user });
  } catch (e) {
    return next(e);
  }
});

router.get("/:username", correctUserOrAdmin, async (req, res, next) => {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:username", correctUserOrAdmin, async (req, res, next) => {
  try {
    await User.delete(req.params.username);
    return res.json({ message: `deteled ${req.params.username}` });
  } catch (e) {
    return next(e);
  }
});

router.patch("/:username", correctUserOrAdmin, async (req, res, next) => {
  try {
    const user = await User.update(req.body.username, req.body);
    return res.json({ user });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
