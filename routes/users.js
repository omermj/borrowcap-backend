const express = require("express");
const User = require("../models/user");
const jsonschema = require("jsonschema");
const userAddSchema = require("../schemas/userAdd.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const changePasswordSchema = require("../schemas/changePassword.json");
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

/** Get a single user from database */
router.get("/:username", correctUserOrAdmin, async (req, res, next) => {
  try {
    const user = await User.getByUsername(req.params.username);
    return res.json({ user });
  } catch (e) {
    return next(e);
  }
});

/** Delete user */
router.delete("/:username", async (req, res, next) => {
  try {
    const result = await User.delete(req.params.username);
    return res.json({ message: `deteled ${req.params.username}` });
  } catch (e) {
    return next(e);
  }
});

/** Update user information in database. Not used to update password */
router.patch("/:username", correctUserOrAdmin, async (req, res, next) => {
  try {
    if (req.body.password) delete req.body.password;
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    const user = await User.update(req.body.username, req.body);
    return res.json({ user });
  } catch (e) {
    return next(e);
  }
});

/** Update user password */
router.patch(
  "/:username/changepassword",
  correctUserOrAdmin,
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

/** Get Active Requests for Borrower */
router.get("/:id/activerequests", async (req, res, next) => {
  try {
    const activeRequests = await User.getActiveRequests(req.params.id);
    return res.json({ activeRequests });
  } catch (e) {
    return next(e);
  }
});

/** Get Funded Loans for Borrower */
router.get("/:id/fundedloans", async (req, res, next) => {
  try {
    const fundedLoans = await User.getFundedLoansForBorrower(req.params.id);
    return res.json({ fundedLoans });
  } catch (e) {
    return next(e);
  }
});

/** Get Approved Requests for Borrower */
router.get("/:id/approvedrequests", async (req, res, next) => {
  try {
    const approvedRequests = await User.getApprovedRequestsForBorrower(
      req.params.id
    );
    return res.json({ approvedRequests });
  } catch (e) {
    return next(e);
  }
});

/** Get Active Investments for Investors */
router.get("/:id/activeinvestments", async (req, res, next) => {
  try {
    const activeInvestments = await User.getActiveInvestmentsForInvestor(
      req.params.id
    );
    return res.json({ activeInvestments });
  } catch (e) {
    return next(e);
  }
});

/** Get Pledged Investments for Investors */
router.get("/:id/pledgedinvestments", async (req, res, next) => {
  try {
    const pledgedInvestments = await User.getPledgedInvestmentsForInvestor(
      req.params.id
    );
    return res.json({ pledgedInvestments });
  } catch (e) {
    return next(e);
  }
});

/** Deposit Funds in User's Account Balance */
router.patch("/:id/deposit", async (req, res, next) => {
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
router.patch("/:id/withdraw", async (req, res, next) => {
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

module.exports = router;
