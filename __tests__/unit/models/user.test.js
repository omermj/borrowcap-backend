"use strict";

const User = require("../../../models/user.js");
const db = require("../../../db.js");
const {
  ExpressError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} = require("../../../expressError.js");
const {
  commonAfterAll,
  commonAfterEach,
  commonBeforeAll,
  commonBeforeEach,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterAll(commonAfterAll);
afterEach(commonAfterEach);

describe("authenticate", () => {
  test("works", async () => {
    const user = await User.authenticate("u1", "passwordu");
    expect(user).toEqual({
      id: expect.any(Number),
      username: "u1",
      firstName: "U1First",
      lastName: "U1Last",
      email: "u1@email.com",
      accountBalance: "0",
      otherMonthlyDebt: "0",
      annualIncome: "0",
      roles: ["admin"],
    });
  });
  test("unauth if no such user", async () => {
    try {
      await User.authenticate("wrong-user", "passwordu");
      fail();
    } catch (e) {
      expect(e instanceof UnauthorizedError).toBeTruthy();
    }
  });
  test("unauth if wrong paswword", async () => {
    try {
      await User.authenticate("u1", "wrong-password");
      fail();
    } catch (e) {
      expect(e instanceof UnauthorizedError).toBeTruthy();
    }
  });
  test("error if no username provided", async () => {
    try {
      await User.authenticate("", "passwordu");
      fail();
    } catch (e) {
      expect(e instanceof UnauthorizedError).toBeTruthy();
    }
  });
  test("error if no password provided", async () => {
    try {
      await User.authenticate("u1", "");
      fail();
    } catch (e) {
      expect(e instanceof UnauthorizedError).toBeTruthy();
    }
  });
  test("error if no arguments", async () => {
    try {
      await User.authenticate();
      fail();
    } catch (e) {
      expect(e instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

describe("add", () => {
  const newUser = {
    username: "newUser",
    firstName: "First",
    lastName: "Last",
    email: "newuser@email.com",
    accountBalance: "0",
    annualIncome: "100000",
    otherMonthlyDebt: "10000",
    roles: ["borrower"],
  };

  test("works for borrower", async () => {
    const noOfUsersBefore = (await User.getAll()).length;
    newUser.password = "password";
    const user = await User.add({ ...newUser });
    delete newUser.password;

    // match added user
    expect(user).toEqual({ ...newUser, id: expect.any(Number) });

    // test is user count has increased by 1
    const noOfUsersAfter = await (await User.getAll()).length;
    expect(noOfUsersAfter).toEqual(noOfUsersBefore + 1);

    // test if password is hashed
    const result = await db.query(
      `SELECT * FROM users WHERE username = 'newUser'`
    );
    expect(result.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("works for investor", async () => {
    const noOfUsersBefore = (await User.getAll()).length;
    newUser.password = "password";
    newUser.roles[0] = "investor";
    const user = await User.add({ ...newUser });
    delete newUser.password;

    // match added user
    expect(user).toEqual({ ...newUser, id: expect.any(Number) });

    // test is user count has increased by 1
    const noOfUsersAfter = await (await User.getAll()).length;
    expect(noOfUsersAfter).toEqual(noOfUsersBefore + 1);

    // test if password is hashed
    const result = await db.query(
      `SELECT * FROM users WHERE username = 'newUser'`
    );
    expect(result.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("works for admin", async () => {
    const noOfUsersBefore = (await User.getAll()).length;
    newUser.password = "password";
    newUser.roles[0] = "admin";
    const user = await User.add({ ...newUser });
    delete newUser.password;

    // match added user
    expect(user).toEqual({ ...newUser, id: expect.any(Number) });

    // test is user count has increased by 1
    const noOfUsersAfter = await (await User.getAll()).length;
    expect(noOfUsersAfter).toEqual(noOfUsersBefore + 1);

    // test if password is hashed
    const result = await db.query(
      `SELECT * FROM users WHERE username = 'newUser'`
    );
    expect(result.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("error on bad request with duplicated data", async () => {
    try {
      await User.add({ ...newUser, password: "password" });
      await User.add({ ...newUser, password: "password" });
      fail();
    } catch (e) {
      expect(e instanceof BadRequestError).toBeTruthy();
    }
  });
});

describe("getAll", () => {
  test("works", async () => {
    const users = await User.getAll();
    expect(users).toEqual([
      {
        id: 1,
        username: "u1",
        firstName: "U1First",
        lastName: "U1Last",
        email: "u1@email.com",
        accountBalance: "0",
        annualIncome: "0",
        otherMonthlyDebt: "0",
      },
      {
        id: 2,
        username: "b1",
        firstName: "B1First",
        lastName: "B1Last",
        email: "b1@email.com",
        accountBalance: "50000",
        annualIncome: "100000",
        otherMonthlyDebt: "2000",
      },
      {
        id: 3,
        username: "i1",
        firstName: "I1First",
        lastName: "I1Last",
        email: "i1@email.com",
        accountBalance: "50000",
        annualIncome: "100000",
        otherMonthlyDebt: "2000",
      },
    ]);
  });
});

describe("get", () => {
  test("works", async () => {
    const user = await User.get(1);
    expect(user).toEqual({
      id: 1,
      username: "u1",
      firstName: "U1First",
      lastName: "U1Last",
      email: "u1@email.com",
      accountBalance: "0",
      annualIncome: "0",
      otherMonthlyDebt: "0",
      roles: ["admin"],
    });
  });

  test("error if no user is found", async () => {
    try {
      const user = await User.get(100);
      fail();
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("getByUsername", () => {
  test("works", async () => {
    const user = await User.getByUsername("u1");
    expect(user).toEqual({
      id: 1,
      username: "u1",
      firstName: "U1First",
      lastName: "U1Last",
      email: "u1@email.com",
      accountBalance: "0",
      annualIncome: "0",
      otherMonthlyDebt: "0",
      roles: ["admin"],
    });
  });

  test("error if no user is found", async () => {
    try {
      const user = await User.getByUsername("wrong-username");
      fail();
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("delete", () => {
  test("works", async () => {
    const noOfUsersBefore = (await User.getAll()).length;
    User.delete(1);
    const noOfUsersAfter = (await User.getAll()).length;

    expect(noOfUsersAfter).toEqual(noOfUsersBefore - 1);
  });

  test("incorrect user id", async () => {
    try {
      await User.delete(100);
      fail();
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("update", () => {
  const updatedData = {
    firstName: "newF",
    lastName: "newL",
    email: "new@email.com",
  };

  test("works", async () => {
    const b1 = await User.getByUsername("b1");
    delete b1.roles;
    const user = await User.update("b1", updatedData);
    expect(user).toEqual({ ...b1, ...updatedData });
  });

  test("incorrect username", async () => {
    try {
      const user = await User.update("wrong-user", updatedData);
      fail();
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if no data", async () => {
    try {
      const user = await User.update("wrong-user");
      fail();
    } catch (e) {
      expect(e instanceof BadRequestError).toBeTruthy();
    }
  });
});

describe("updatePassword", () => {
  test("works", async () => {
    await User.updatePassword("b1", "passwordb", "new-password");

    // test new password works
    const user = await User.authenticate("b1", "new-password");
    expect(user.username).toEqual("b1");

    // test old password does not work
    try {
      await User.authenticate("b1", "passwordb");
      fail();
    } catch (e) {
      expect(e instanceof UnauthorizedError).toBeTruthy();
    }
  });

  test("error if incorrect currentPassword", async () => {
    try {
      await User.updatePassword("b1", "wrong-password", "new-password");
    } catch (e) {
      expect(e instanceof UnauthorizedError).toBeTruthy();
    }
  });

  test("error if incorrect username", async () => {
    try {
      await User.updatePassword("wrong-username", "passwordb", "new-password");
    } catch (e) {
      expect(e instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

describe("assignRoles", () => {
  test("works", async () => {
    await User.assignRoles(2, ["investor"]);
    const user = await User.get(2);
    expect(user.roles.includes("investor")).toBe(true);
  });

  test("error if role is not defined", async () => {
    await expect(User.assignRoles(2, ["unknown"])).rejects.toThrow(
      BadRequestError
    );
  });
});

describe("getRoles", () => {
  test("works", async () => {
    const roles = await User.getRoles(1);
    expect(roles.includes("admin")).toBe(true);
  });

  test("error if userId is incorrect", async () => {
    await expect(User.getRoles(100)).rejects.toThrow(NotFoundError);
  });
});

describe("depositFunds", () => {
  test("works", async () => {
    let user = await User.get(2);
    const previousBalance = +user.accountBalance;
    await User.depositFunds(2, 10000);
    user = await User.get(2);
    const newBalance = user.accountBalance;

    expect(+newBalance).toEqual(+previousBalance + 10000);
  });

  test("error if userId is incorrect", async () => {
    await expect(User.depositFunds(100, 1000)).rejects.toThrow(NotFoundError);
  });
});

describe("withdrawFunds", () => {
  test("works", async () => {
    let user = await User.get(2);
    const previousBalance = +user.accountBalance;
    await User.withdrawFunds(2, 5000);
    user = await User.get(2);
    const newBalance = +user.accountBalance;

    expect(newBalance).toEqual(previousBalance - 5000);
  });

  test("error if withdrawal is more than balance", async () => {
    await expect(User.withdrawFunds(2, 70000)).rejects.toThrow(BadRequestError);
  });

  test("error if userId is incorrect", async () => {
    await expect(User.depositFunds(100, 1000)).rejects.toThrow(NotFoundError);
  });
});
