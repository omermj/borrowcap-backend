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
const { NotFoundError } = require("../../../expressError");

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

// DELETE /users/:username
describe("DELETE /users/:username", () => {
  test("works", async () => {
    let users = await User.getAll();
    const numberUsersBefore = users.length;

    const resp = await request(app)
      .delete("/users/2")
      .set("authorization", u1Token);

    users = await User.getAll();
    const numberUsersAfter = users.length;

    expect(numberUsersAfter).toEqual(numberUsersBefore - 1);
    await expect(User.get(2)).rejects.toThrow(NotFoundError);
  });
  test("404 on non-existent user id", async () => {
    const resp = await request(app)
      .delete("/users/20")
      .set("authorization", u1Token);
  });
  test("404 on incorrect user id", async () => {
    const resp = await request(app)
      .delete("/users/wrong")
      .set("authorization", u1Token);
    console.log(resp.body);
    expect(resp.statusCode).toEqual(500);
  });
  test("unauth on anon", async () => {
    const resp = await request(app).delete("/users/2");
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth on non-admin", async () => {
    const resp = await request(app)
      .delete("/users/2")
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth on no user", async () => {
    const resp = await request(app).delete("/users/2");
    expect(resp.statusCode).toEqual(401);
  });
});

describe("PATCH /users/:username", () => {
  test("works for user", async () => {
    const resp = await request(app)
      .patch("/users/b1")
      .send({
        firstName: "New First",
        lastName: "New Last",
        email: "newemail@email.com",
      })
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(200);
    const expectedData = {
      id: 2,
      username: "b1",
      firstName: "New First",
      lastName: "New Last",
      email: "newemail@email.com",
      accountBalance: "50000",
      annualIncome: "100000",
      otherMonthlyDebt: "2000",
    };
    expect(resp.body).toEqual({ user: expectedData });
    const user = await User.get(2);
    expect(user).toEqual({ ...expectedData, roles: ["borrower"] });
  });
  test("works for admin", async () => {
    const resp = await request(app)
      .patch("/users/b1")
      .send({
        firstName: "New First",
        lastName: "New Last",
        email: "newemail@email.com",
      })
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(200);
    const expectedData = {
      id: 2,
      username: "b1",
      firstName: "New First",
      lastName: "New Last",
      email: "newemail@email.com",
      accountBalance: "50000",
      annualIncome: "100000",
      otherMonthlyDebt: "2000",
    };
    expect(resp.body).toEqual({ user: expectedData });
    const user = await User.get(2);
    expect(user).toEqual({ ...expectedData, roles: ["borrower"] });
  });
  test("401 on non-admin and unrelated user", async () => {
    const resp = await request(app)
      .patch("/users/b1")
      .send({
        firstName: "New First",
        lastName: "New Last",
        email: "newemail@email.com",
      })
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("404 on incorrect user", async () => {
    const resp = await request(app)
      .patch("/users/wrong")
      .send({
        firstName: "New First",
        lastName: "New Last",
        email: "newemail@email.com",
      })
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(404);
  });
  test("400 on incorrect email", async () => {
    const resp = await request(app)
      .patch("/users/b1")
      .send({
        firstName: "New First",
        lastName: "New Last",
        email: "wrong-email",
      })
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("400 on incorrect annual income", async () => {
    const resp = await request(app)
      .patch("/users/b1")
      .send({
        firstName: "New First",
        lastName: "New Last",
        email: "new@email.com",
        annualIncome: -1000,
      })
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("400 on incorrect otherMonthlyDebt", async () => {
    const resp = await request(app)
      .patch("/users/b1")
      .send({
        firstName: "New First",
        lastName: "New Last",
        email: "new@email.com",
        annualIncome: 150000,
        otherMonthlyDebt: -10000,
      })
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(400);
  });
});

describe("PATCH /users/:id/deposit", () => {
  test("works for user", async () => {
    let user = await User.get(2);
    const balanceBefore = user.accountBalance;

    const resp = await request(app)
      .patch("/users/2/deposit")
      .send({ amount: 1000 })
      .set("authorization", b1Token);
    user = await User.get(2);
    const balanceAfter = user.accountBalance;

    expect(resp.statusCode).toEqual(200);
    expect(+balanceAfter).toEqual(+balanceBefore + 1000);
  });
  test("401 on unauth user", async () => {
    const resp = await request(app)
      .patch("/users/2/deposit")
      .send({ amount: 1000 })
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("401 on no user", async () => {
    const resp = await request(app)
      .patch("/users/2/deposit")
      .send({ amount: 1000 });
    expect(resp.statusCode).toEqual(401);
  });
  test("401 on incorrect user", async () => {
    const resp = await request(app)
      .patch("/users/30/deposit")
      .send({ amount: 1000 })
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("error in incorrect amount", async () => {
    const resp = await request(app)
      .patch("/users/2/deposit")
      .send({ amount: -1000 })
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(400);
  });
});

describe("PATCH /users/:id/withdraw", () => {
  test("works for user", async () => {
    let user = await User.get(2);
    const balanceBefore = user.accountBalance;

    const resp = await request(app)
      .patch("/users/2/withdraw")
      .send({ amount: 1000 })
      .set("authorization", b1Token);
    user = await User.get(2);
    const balanceAfter = user.accountBalance;

    expect(resp.statusCode).toEqual(200);
    expect(+balanceAfter).toEqual(+balanceBefore - 1000);
  });
  test("401 on unauth user", async () => {
    const resp = await request(app)
      .patch("/users/2/withdraw")
      .send({ amount: 1000 })
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("401 on no user", async () => {
    const resp = await request(app)
      .patch("/users/2/withdraw")
      .send({ amount: 1000 });
    expect(resp.statusCode).toEqual(401);
  });
  test("401 on incorrect user", async () => {
    const resp = await request(app)
      .patch("/users/30/withdraw")
      .send({ amount: 1000 })
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("error on negative amount", async () => {
    const resp = await request(app)
      .patch("/users/2/withdraw")
      .send({ amount: -1000 })
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("error on higher amount than balance", async () => {
    const resp = await request(app)
      .patch("/users/2/withdraw")
      .send({ amount: 1000000 })
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(400);
  });
});
