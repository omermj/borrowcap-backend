"use strict";

/** Backend for BorrowCap App */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

module.exports = app;
