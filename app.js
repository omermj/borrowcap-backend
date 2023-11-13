"use strict";

/** Backend for BorrowCap App */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const activeRequestsRoutes = require("./routes/activeRequests");
const approvedRequestRoutes = require("./routes/approvedRequests");
const fundedLoansRoutes = require("./routes/fundedLoans");
const rolesRoutes = require("./routes/roles");
const purposeRoutes = require("./routes/purposes");
const termRoutes = require("./routes/terms");
const cancelledRequestRoutes = require("./routes/cancelledRequests");
const { ExpressError, NotFoundError } = require("./expressError");
const { authenticateJWT } = require("./middleware/auth");

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT); // this middleware looks for a token in the req header
// and if it finds it, it passes the signed user details to the next middeware

// routes
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/activerequests", activeRequestsRoutes);
app.use("/approvedrequests", approvedRequestRoutes);
app.use("/fundedloans", fundedLoansRoutes);
app.use("/roles", rolesRoutes);
app.use("/purposes", purposeRoutes);
app.use("/terms", termRoutes);
app.use("/cancelledrequests", cancelledRequestRoutes);

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
