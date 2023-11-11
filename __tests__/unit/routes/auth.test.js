"use strict";

const request = require("supertest");
const User = require("../../../models/user");
const app = require("../../../app");
const {
  commonAfterAll,
  commonAfterEach,
  commonBeforeAll,
  commonBeforeEach,
  u1Token,
  b1Token,
  i1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("POST /auth/token", () => {
  test("works", async () => {
    const resp = await request(app).post("/auth/token").send({
      username: "b1",
      password: "passwordb",
    });
    expect(resp.body).toEqual({
      token: expect.any(String),
    });
  });
  test("unauth with non-existent user", async () => {
    const resp = await request(app).post("/auth/token").send({
      username: "wrong-user",
      password: "passwordb",
    });
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth with wrong password", async () => {
    const resp = await request(app).post("/auth/token").send({
      username: "b1",
      password: "wrong-password",
    });
    expect(resp.statusCode).toEqual(401);
  });
  test("bad request with missing data", async () => {
    const resp = await request(app).post("/auth/token").send({
      username: "b1",
    });
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request with invalid data", async () => {
    const resp = await request(app).post("/auth/token").send({
      username: 123,
      password: "abc",
    });
    expect(resp.statusCode).toEqual(400);
  });
});

describe("POST /auth/register", () => {
  test("works for anon", async () => {
    let users = await User.getAll();
    const numberUserBefore = users.length;

    const resp = await request(app)
      .post("/auth/register")
      .send({
        username: "testuser",
        password: "password",
        firstName: "Test",
        lastName: "User",
        email: "test@email.com",
        annualIncome: 90000,
        otherMonthlyDebt: 1500,
        roles: ["borrower"],
      });

    users = await User.getAll();
    const numberUserAfter = users.length;

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ token: expect.any(String) });
    expect(numberUserAfter).toEqual(numberUserBefore + 1);
  });
  test("bad request for missing fields", async () => {
    const resp = await request(app).post("/auth/register").send({
      username: "testuser",
      password: "password",
      firstName: "Test",
      lastName: "User",
    });
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request for invalid email", async () => {
    const resp = await request(app)
      .post("/auth/register")
      .send({
        username: "testuser",
        password: "password",
        firstName: "Test",
        lastName: "User",
        email: "invalid-email",
        annualIncome: 90000,
        otherMonthlyDebt: 1500,
        roles: ["borrower"],
      });
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request for invalid annualIncome", async () => {
    const resp = await request(app)
      .post("/auth/register")
      .send({
        username: "testuser",
        password: "password",
        firstName: "Test",
        lastName: "User",
        email: "test@emai..com",
        annualIncome: -90000,
        otherMonthlyDebt: 1500,
        roles: ["borrower"],
      });
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request for invalid otherMonthlyDebt", async () => {
    const resp = await request(app)
      .post("/auth/register")
      .send({
        username: "testuser",
        password: "password",
        firstName: "Test",
        lastName: "User",
        email: "test@emai..com",
        annualIncome: 90000,
        otherMonthlyDebt: -1500,
        roles: ["borrower"],
      });
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request for invalid role", async () => {
    const resp = await request(app)
      .post("/auth/register")
      .send({
        username: "testuser",
        password: "password",
        firstName: "Test",
        lastName: "User",
        email: "test@emai..com",
        annualIncome: 90000,
        otherMonthlyDebt: 1500,
        roles: ["admin"],
      });
    expect(resp.statusCode).toEqual(400);
  });
});
