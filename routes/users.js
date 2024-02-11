const express = require("express");
const User = require("../models/user");
const jsonschema = require("jsonschema");
const userAddSchema = require("../schemas/userAdd.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const changePasswordSchema = require("../schemas/changePassword.json");
const { BadRequestError } = require("../expressError");
const {
  ensureAdmin,
  ensureAdminOrLoggedIn,
  ensureLoggedIn,
  ensureCorrectUser,
} = require("../middleware/auth");

const router = express.Router();
//ensureAdmin

/** Get all users from db */
router.get("/", ensureAdmin, async (req, res, next) => {
  try {
    const users = await User.getAll();
    return res.json({ users });
  } catch (e) {
    return next(e);
  }
});

/** Get a single user from database */
router.get("/:username", ensureAdminOrLoggedIn, async (req, res, next) => {
  try {
    const user = await User.getByUsername(req.params.username);
    return res.json({ user });
  } catch (e) {
    return next(e);
  }
});

/** Add new user in database. Only for admins. */
//ensureAdmin
router.post("/", ensureAdmin, async (req, res, next) => {
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

/** Delete user */
router.delete("/:id", ensureAdmin, async (req, res, next) => {
  try {
    const user = await User.delete(req.params.id);
    return res.json({ message: `deteled ${req.params.id}` });
  } catch (e) {
    return next(e);
  }
});

/** Update user information in database. Not used to update password */
router.patch("/:username", ensureAdminOrLoggedIn, async (req, res, next) => {
  try {
    if (req.body.password) delete req.body.password;
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (e) {
    return next(e);
  }
});

/** Update user password */
router.patch(
  "/:username/changepassword",
  ensureAdminOrLoggedIn,
  async (req, res, next) => {
    try {
      const validator = jsonschema.validate(req.body, changePasswordSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }
      const user = await User.updatePassword(
        req.params.username,
        req.body.currentPassword,
        req.body.newPassword
      );
      return res.json({ user });
    } catch (e) {
      return next(e);
    }
  }
);

/** Deposit Funds in User's Account Balance */
router.patch("/:id/deposit", ensureCorrectUser, async (req, res, next) => {
  try {
    if (!req.body.amount) throw new BadRequestError("Amount is required.");
    const accountBalance = await User.depositFunds(
      req.params.id,
      req.body.amount
    );
    return res.json({ accountBalance });
  } catch (e) {
    return next(e);
  }
});

/** Withdraw Funds from User's Account Balance */
router.patch("/:id/withdraw", ensureCorrectUser, async (req, res, next) => {
  try {
    if (!req.body.amount) throw new BadRequestError("Amount is required.");
    const accountBalance = await User.withdrawFunds(
      req.params.id,
      req.body.amount
    );
    return res.json({ accountBalance });
  } catch (e) {
    return next(e);
  }
});

/** Get User Statistics */
router.get("/:id/stats", ensureCorrectUser, async (req, res, next) => {
  try {
    const stats = await User.getStats(req.params.id);
    return res.json({ stats });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
