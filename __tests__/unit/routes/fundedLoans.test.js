"use strict";

const request = require("supertest");
const app = require("../../../app");
const FundedLoan = require("../../../models/fundedLoan");
const ApprovedRequest = require("../../../models/approvedRequest");
const CancelledRequest = require("../../../models/cancelledRequest");
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

describe("GET /fundedloans", () => {
  test("works for admin", async () => {
    await ApprovedRequest.enableFunding(3);
    await ApprovedRequest.enableFunding(4);
    await ApprovedRequest.fund(3, 3, 9000);
    await ApprovedRequest.fund(4, 3, 18000);

    const resp = await request(app)
      .get("/fundedloans")
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      fundedLoans: [
        {
          id: 3,
          borrowerId: 2,
          amtFunded: "9000",
          fundedDate: expect.any(String),
          interestRate: "0.05",
          term: 24,
          installmentAmt: "375.20",
          remainingBalance: "9000",
        },
        {
          id: 4,
          borrowerId: 2,
          amtFunded: "18000",
          fundedDate: expect.any(String),
          interestRate: "0.07",
          term: 36,
          installmentAmt: "500.54",
          remainingBalance: "18000",
        },
      ],
    });
  });
  test("unauth for non-admin", async () => {
    await ApprovedRequest.enableFunding(3);
    await ApprovedRequest.fund(3, 3, 9000);

    const resp = await request(app)
      .get("/fundedloans")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non user", async () => {
    await ApprovedRequest.enableFunding(3);
    await ApprovedRequest.fund(3, 3, 9000);

    const resp = await request(app).get("/fundedLoans");
    expect(resp.statusCode).toEqual(401);
  });
});

describe("GET /fundedloans/:appId", () => {
  test("works for logged in user", async () => {
    await ApprovedRequest.enableFunding(3);
    await ApprovedRequest.fund(3, 3, 9000);

    const resp = await request(app)
      .get("/fundedloans/3")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      fundedLoan: {
        id: 3,
        borrowerId: 2,
        amtFunded: "9000",
        fundedDate: expect.any(String),
        interestRate: "0.05",
        term: 24,
        installmentAmt: "375.20",
        remainingBalance: "9000",
      },
    });
  });
  test("unauth for non user", async () => {
    await ApprovedRequest.enableFunding(3);
    await ApprovedRequest.fund(3, 3, 9000);

    const resp = await request(app).get("/fundedloans/3");
    expect(resp.statusCode).toEqual(401);
  });
});

describe("PATCH /fundedloans/:appId/payinstallment", () => {
  test("works for correct borrower", async () => {
    await ApprovedRequest.enableFunding(3);
    await ApprovedRequest.fund(3, 3, 9000);

    const resp = await request(app)
      .patch("/fundedloans/3/payinstallment")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      fundedLoan: {
        id: 3,
        borrowerId: 2,
        amtFunded: "9000",
        fundedDate: expect.any(String),
        interestRate: "0.05",
        term: 24,
        installmentAmt: "375.20",
        remainingBalance: "8662.3",
      },
    });
  });
  test("unauth for incorrect user", async () => {
    await ApprovedRequest.enableFunding(3);
    await ApprovedRequest.fund(3, 3, 9000);

    const resp = await request(app)
      .patch("/fundedloans/3/payinstallment")
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for no user", async () => {
    await ApprovedRequest.enableFunding(3);
    await ApprovedRequest.fund(3, 3, 9000);
    const resp = await request(app).patch("/fundedloans/3/payinstallment");
    expect(resp.statusCode).toEqual(401);
  });
});

describe("GET /fundedloans/:appId/users", () => {
  test("works for logged in user", async () => {
    await ApprovedRequest.enableFunding(3);
    await ApprovedRequest.fund(3, 3, 9000);

    const resp = await request(app)
      .get("/fundedloans/2/users")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      fundedLoans: {
        borrower: [
          {
            id: 3,
            amtFunded: "9000",
            fundedDate: expect.any(String),
            interestRate: "0.05",
            term: 24,
            installmentAmt: "375.20",
            remainingBalance: "9000",
          },
        ],
      },
    });
  });
});
