const express = require("express");

const User = require("../models/user");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const users = await User.getAll();
    return res.json({ users });
  } catch (e) {
    return next(e);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const result = await User.register(req.body);
    return res.json({ message: "User added" });
  } catch (e) {
    return next(e);
  }
});

router.get("/:username", async (req, res, next) => {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:username", async (req, res, next) => {
  try {
    await User.delete(req.params.username);
    return res.json({ message: `deteled ${req.params.username}` });
  } catch (e) {
    return next(e);
  }
});

router.patch("/:username", async (req, res, next) => {
  try {
    const user = await User.update(req.body.username, req.body);
    return res.json({ user });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
