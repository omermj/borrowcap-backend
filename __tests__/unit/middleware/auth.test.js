"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../../../expressError");
const {
  commonAfterAll,
  commonAfterEach,
  commonBeforeAll,
  commonBeforeEach,
} = require("./_testCommon.js");
const { authenticateJWT } = require("../../../middleware/auth");
const { SECRET_KEY } = require("../../../config");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const goodJwt = jwt.sign(
  { id: 1, username: "test", isAdmin: false },
  SECRET_KEY
);
const badJwt = jwt.sign(
  { id: 1, username: "test", isAdmin: false },
  "incorrect-key"
);

describe("authenticateJWT", () => {
  test("works with good key", () => {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${goodJwt}` } };
    const res = { locals: {} };
    const next = (err) => {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        id: 1,
        username: "test",
        isAdmin: false,
        iat: expect.any(Number),
      },
    });
  });
  test("works with invalid token", () => {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = (err) => {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});
