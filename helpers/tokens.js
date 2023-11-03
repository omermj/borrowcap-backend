"use strict";

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** Returns signed JWT from user data */

function createToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    isAdmin: user.roles.includes("admin") || false,
  };
  return jwt.sign(payload, SECRET_KEY);
}

module.exports = { createToken };
