"use strict";

const request = require("supertest");
const app = require("../../../app");
const User = require("../../../models/user");
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

/** GET /users */
describe("GET /users", () => {
  test("works for admin", async () => {
    const resp = await request(app).get("/users").set("authorization", u1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      users: [
        {
          accountBalance: "0",
          annualIncome: "0",
          email: "u1@email.com",
          firstName: "U1First",
          id: expect.any(Number),
          lastName: "U1Last",
          otherMonthlyDebt: "0",
          username: "u1",
        },
        {
          accountBalance: "50000",
          annualIncome: "100000",
          email: "b1@email.com",
          firstName: "B1First",
          id: expect.any(Number),
          lastName: "B1Last",
          otherMonthlyDebt: "2000",
          username: "b1",
        },
        {
          accountBalance: "50000",
          annualIncome: "100000",
          email: "i1@email.com",
          firstName: "I1First",
          id: expect.any(Number),
          lastName: "I1Last",
          otherMonthlyDebt: "2000",
          username: "i1",
        },
      ],
    });
  });
  test("unauth for anon", async () => {
    const resp = await request(app).get("/users");
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non-admin user", async () => {
    const resp = await request(app).get("/users").set("authorization", b1Token);
    expect(resp.statusCode).toEqual(401);
  });
});

/** GET /users/:username */
describe("GET /users/:username", () => {
  test("works for users", async () => {
    const resp = await request(app)
      .get(`/users/b1`)
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      user: {
        accountBalance: "50000",
        annualIncome: "100000",
        email: "b1@email.com",
        firstName: "B1First",
        id: expect.any(Number),
        lastName: "B1Last",
        otherMonthlyDebt: "2000",
        username: "b1",
        roles: ["borrower"],
      },
    });
  });
  test("works for admin", async () => {
    const resp = await request(app)
      .get(`/users/b1`)
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      user: {
        accountBalance: "50000",
        annualIncome: "100000",
        email: "b1@email.com",
        firstName: "B1First",
        id: expect.any(Number),
        lastName: "B1Last",
        otherMonthlyDebt: "2000",
        username: "b1",
        roles: ["borrower"],
      },
    });
  });
  test("unauth for anon", async () => {
    const resp = await request(app).get("/users/b1");
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non-admin and other user", async () => {
    const resp = await request(app)
      .get("/users/b1")
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("404 if user not found", async () => {
    const resp = await request(app)
      .get("/users/wrong")
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(404);
  });
});

/** POST /users */
describe("POST /users", () => {
  const newUserData = {
    username: "test",
    password: "password",
    firstName: "Test",
    lastName: "User",
    email: "test@email.com",
    annualIncome: 50000,
    otherMonthlyDebt: 3000,
    roles: ["investor"],
  };
  test("works for admin", async () => {
    let users = await User.getAll();
    const numberUsersBefore = users.length;
    const resp = await request(app)
      .post("/users")
      .send(newUserData)
      .set("authorization", u1Token);
    users = await User.getAll();
    expect(resp.statusCode).toEqual(201);
    expect(users.length).toEqual(numberUsersBefore + 1);
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        username: "test",
        firstName: "Test",
        lastName: "User",
        email: "test@email.com",
        annualIncome: "50000",
        otherMonthlyDebt: "3000",
        accountBalance: "0",
        roles: ["investor"],
      },
    });
  });
  test("unauth for non-admin", async () => {
    const resp = await request(app)
      .post("/users")
      .send(newUserData)
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for anon", async () => {
    const resp = await request(app).post("/users").send(newUserData);
    expect(resp.statusCode).toEqual(401);
  });
  test("bad request if missing data", async () => {
    delete newUserData.username;
    const resp = await request(app)
      .post("/users")
      .send(newUserData)
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request if incorrect data", async () => {
    newUserData.email = "wrong-email";
    const resp = await request(app)
      .post("/users")
      .send(newUserData)
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(400);
  });
});
