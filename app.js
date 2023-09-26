"use strict";

/** Backend for BorrowCap App */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRoutes = require("./routes/users");
const { ExpressError, NotFoundError } = require("./expressError");

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

// routes
app.use("/users", userRoutes);

/** Handle 404 errors */
app.use(function (req, res, next) {
  const err = new NotFoundError();
  return next(err);
});

/** Generic Error Handler */
app.use(function (err, req, res, next) {
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
