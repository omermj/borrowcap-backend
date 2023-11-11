"use strict";

const request = require("supertest");
const app = require("../../../app");
const ActiveRequest = require("../../../models/activeRequest");
const {
  commonAfterAll,
  commonAfterEach,
  commonBeforeAll,
  commonBeforeEach,
  u1Token,
  b1Token,
  i1Token,
} = require("./_testCommon");

const { getInterestRates } = require("../../../helpers/interestRate.js");
jest.mock("../../../helpers/interestRate.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("GET /activerequests", () => {
  test("works for admin", async () => {
    const resp = await request(app)
      .get("/activerequests")
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      activeRequests: [
        {
          id: 1,
          borrowerId: 2,
          amtRequested: "5000",
          purpose: "Car",
          purposeId: 2,
          appOpenDate: expect.any(String),
          interestRate: "0.084",
          term: 24,
          installmentAmt: "226.14",
        },
        {
          id: 2,
          borrowerId: 2,
          amtRequested: "10000",
          purpose: "Education",
          purposeId: 3,
          appOpenDate: expect.any(String),
          interestRate: "0.094",
          term: 36,
          installmentAmt: "319.86",
        },
      ],
    });
  });
  test("unauth for non-admin", async () => {
    const resp = await request(app)
      .get("/activerequests")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non-user", async () => {
    const resp = await request(app).get("/activerequests");
    expect(resp.statusCode).toEqual(401);
  });
});

describe("GET /activeusers/:id", () => {
  test("works for admin", async () => {
    const resp = await request(app)
      .get("/activerequests/1")
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      activeRequest: {
        id: 1,
        borrowerId: 2,
        amtRequested: "5000",
        purpose: "Car",
        purposeId: 2,
        appOpenDate: expect.any(String),
        interestRate: "0.084",
        term: 24,
        installmentAmt: "226.14",
        accountBalance: "50000",
        annualIncome: "100000",
        email: "b1@email.com",
        firstName: "B1First",
        lastName: "B1Last",
        otherMonthlyDebt: "2000",
        username: "b1",
      },
    });
  });
  test("unauth for non-admin", async () => {
    const resp = await request(app)
      .get("/activerequests/1")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non-user", async () => {
    const resp = await request(app).get("/activerequests/1");
    expect(resp.statusCode).toEqual(401);
  });
});

describe("GET /activerequests/users/:id", () => {
  test("works for admin", async () => {
    const resp = await request(app)
      .get("/activerequests/users/2")
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      activeRequests: [
        {
          id: 1,
          amtRequested: "5000",
          purpose: "Car",
          appOpenDate: expect.any(String),
          interestRate: "0.084",
          term: 24,
          installmentAmt: "226.14",
        },
        {
          id: 2,
          amtRequested: "10000",
          purpose: "Education",
          appOpenDate: expect.any(String),
          interestRate: "0.094",
          term: 36,
          installmentAmt: "319.86",
        },
      ],
    });
  });
  test("works for user", async () => {
    const resp = await request(app)
      .get("/activerequests/users/2")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      activeRequests: [
        {
          id: 1,
          amtRequested: "5000",
          purpose: "Car",
          appOpenDate: expect.any(String),
          interestRate: "0.084",
          term: 24,
          installmentAmt: "226.14",
        },
        {
          id: 2,
          amtRequested: "10000",
          purpose: "Education",
          appOpenDate: expect.any(String),
          interestRate: "0.094",
          term: 36,
          installmentAmt: "319.86",
        },
      ],
    });
  });
  test("unauth for incorrect user", async () => {
    const resp = await request(app)
      .get("/activerequests/users/2")
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non user", async () => {
    const resp = await request(app).get("/activerequests/users/2");
    expect(resp.statusCode).toEqual(401);
  });
});

describe("POST /activerequests", () => {
  const newRequestData = {
    borrowerId: 2,
    amtRequested: 4000,
    purposeId: 1,
    term: "24",
  };
  test("works for logged in user", async () => {
    // mock getInterestRates
    getInterestRates.mockResolvedValue({
      1: 4.96,
      3: 5.11,
      6: 5.15,
      12: 5.16,
      24: 4.72,
      36: 4.59,
      48: 4.38,
      60: 4.18,
    });
    let activeRequests = await ActiveRequest.getAll();
    const numberActiveRequestsBefore = activeRequests.length;

    const resp = await request(app)
      .post("/activerequests")
      .send(newRequestData)
      .set("authorization", b1Token);

    activeRequests = await ActiveRequest.getAll();
    const numberActiveRequestsAfter = activeRequests.length;

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      loanRequest: {
        id: expect.any(Number),
        borrowerId: 2,
        amtRequested: "4000",
        purposeId: 1,
        appOpenDate: expect.any(String),
        term: 24,
        interestRate: "0.0672",
        installmentAmt: "178.58",
      },
    });
    expect(numberActiveRequestsAfter).toEqual(numberActiveRequestsBefore + 1);
  });
  test("unauth for non-user", async () => {
    const resp = await request(app)
      .post("/activerequests")
      .send(newRequestData);
    expect(resp.statusCode).toEqual(401);
  });
  test("bad request for non-borrower user", async () => {
    newRequestData.borrowerId = 3;
    const resp = await request(app)
      .post("/activerequests")
      .send(newRequestData)
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("404 for incorrect borrowerId", async () => {
    newRequestData.borrowerId = 300;
    const resp = await request(app)
      .post("/activerequests")
      .send(newRequestData)
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(404);
  });
  test("bad request for incorrect amtRequested", async () => {
    newRequestData.amtRequested = -3000;
    const resp = await request(app)
      .post("/activerequests")
      .send(newRequestData)
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request for incorrect purposeId", async () => {
    newRequestData.purposeId = 200;
    const resp = await request(app)
      .post("/activerequests")
      .send(newRequestData)
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request for incorrect term", async () => {
    newRequestData.term = 100;
    const resp = await request(app)
      .post("/activerequests")
      .send(newRequestData)
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(400);
  });
});

