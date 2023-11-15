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

const { getInterestRates } = require("../../../helpers/interestRate.js");
const { NotFoundError } = require("../../../expressError");
jest.mock("../../../helpers/interestRate.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("GET /approvedrequests", () => {
  test("works for admin", async () => {
    const resp = await request(app)
      .get("/approvedrequests")
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      approvedRequests: [
        {
          id: 3,
          borrowerId: 2,
          amtRequested: "10000",
          amtApproved: "9000",
          amtFunded: "0",
          purpose: "Home",
          purposeId: 1,
          appOpenDate: expect.any(String),
          appApprovedDate: expect.any(String),
          fundingDeadline: expect.any(String),
          interestRate: "0.05",
          term: 24,
          installmentAmt: "375.20",
          availableForFunding: false,
          isFunded: false,
        },
        {
          id: 4,
          borrowerId: 2,
          amtRequested: "20000",
          amtApproved: "18000",
          amtFunded: "0",
          purpose: "Car",
          purposeId: 2,
          appOpenDate: expect.any(String),
          appApprovedDate: expect.any(String),
          fundingDeadline: expect.any(String),
          interestRate: "0.07",
          term: 36,
          installmentAmt: "500.54",
          availableForFunding: false,
          isFunded: false,
        },
      ],
    });
  });
  test("unauth for non-admin user", async () => {
    const resp = await request(app)
      .get("/approvedrequests")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non-user", async () => {
    const resp = await request(app).get("/approvedrequests");
    expect(resp.statusCode).toEqual(401);
  });
});

describe("GET /approvedrequests/available", () => {
  test("works for users", async () => {
    await ApprovedRequest.enableFunding(3);
    const resp = await request(app)
      .get("/approvedrequests/available")
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      availableInvestments: [
        {
          id: 3,
          amtApproved: "9000",
          amtFunded: "0",
          purpose: "Home",
          approvedDate: expect.any(String),
          fundingDeadline: expect.any(String),
          interestRate: "0.05",
          term: 24,
        },
      ],
    });
  });
  test("unauth for non-user", async () => {
    await ApprovedRequest.enableFunding(3);
    const resp = await request(app).get("/approvedrequests/available");
    expect(resp.statusCode).toEqual(401);
  });
});

describe("GET /approvedrequests/:id", () => {
  test("works for admin", async () => {
    const resp = await request(app)
      .get("/approvedrequests/3")
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      approvedRequest: {
        id: 3,
        borrowerId: 2,
        amtRequested: "10000",
        amtApproved: "9000",
        amtFunded: "0",
        purpose: "Home",
        purposeId: 1,
        appOpenDate: expect.any(String),
        appApprovedDate: expect.any(String),
        fundingDeadline: expect.any(String),
        interestRate: "0.05",
        term: 24,
        installmentAmt: "375.20",
        availableForFunding: false,
        isFunded: false,
        annualIncome: "100000",
        otherMonthlyDebt: "2000",
      },
    });
  });
  test("works for correct borrower", async () => {
    const resp = await request(app)
      .get("/approvedrequests/3")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(200);
  });
  test("works for investor", async () => {
    const resp = await request(app)
      .get("/approvedrequests/3")
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(200);
  });
  test("unauth for non user", async () => {
    const resp = await request(app).get("/approvedrequests/3");
    expect(resp.statusCode).toEqual(401);
  });
});

describe("DELETE /approvedrequest/:appId/cancel", () => {
  test("works for admin", async () => {
    const resp = await request(app)
      .delete("/approvedrequests/3/cancel")
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(200);

    // check if approvedRequest is deleted
    await expect(ApprovedRequest.get(3)).rejects.toThrow(NotFoundError);

    // check if cancelledRequest is created
    const cancelledRequest = await CancelledRequest.get(3);
    expect(cancelledRequest.id).toEqual(3);
  });
  test("works for authorized user (borrower)", async () => {
    const resp = await request(app)
      .delete("/approvedrequests/3/cancel")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(200);

    // check if approvedRequest is deleted
    await expect(ApprovedRequest.get(3)).rejects.toThrow(NotFoundError);

    // check if cancelledRequest is created
    const cancelledRequest = await CancelledRequest.get(3);
    expect(cancelledRequest.id).toEqual(3);
  });
  test("unauth for unauthorized user", async () => {
    const resp = await request(app)
      .delete("/approvedrequests/3/cancel")
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non-user", async () => {
    const resp = await request(app).delete("/approvedrequests/3/cancel");
    expect(resp.statusCode).toEqual(401);
  });
});

describe("PATCH /approvedrequests/:appId/enablefunding", () => {
  test("works for authorized user", async () => {
    const resp = await request(app)
      .patch("/approvedrequests/3/enablefunding")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(200);

    const approvedRequest = await ApprovedRequest.get(3);
    expect(approvedRequest.availableForFunding).toBe(true);
  });
  test("unauth for unauthorized user", async () => {
    const resp = await request(app)
      .patch("/approvedrequests/3/enablefunding")
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non-user", async () => {
    const resp = await request(app).patch("/approvedrequests/3/enablefunding");
    expect(resp.statusCode).toEqual(401);
  });
});

describe("PATCH /approvedrequests/:appId/fund", () => {
  test("partially fund - works for investor", async () => {
    await ApprovedRequest.enableFunding(3);
    const resp = await request(app)
      .patch("/approvedrequests/3/fund")
      .send({ investorId: 3, amount: 5000 })
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(200);

    const approvedRequest = await ApprovedRequest.get(3);
    expect(approvedRequest.amtFunded).toEqual("5000");
  });
  test("fully fund - works for investor", async () => {
    await ApprovedRequest.enableFunding(3);
    const resp = await request(app)
      .patch("/approvedrequests/3/fund")
      .send({ investorId: 3, amount: 9000 })
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(200);

    const approvedRequest = await ApprovedRequest.get(3);
    expect(approvedRequest.amtFunded).toEqual("9000");

    // check if fundedLoan is created
    const fundedLoan = await FundedLoan.get(3);
    expect(fundedLoan.amtFunded).toEqual("9000");
  });
  test("unauth for non-investor user", async () => {
    await ApprovedRequest.enableFunding(3);
    const resp = await request(app)
      .patch("/approvedrequests/3/fund")
      .send({ amount: 5000 })
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for no user", async () => {
    await ApprovedRequest.enableFunding(3);
    const resp = await request(app)
      .patch("/approvedrequests/3/fund")
      .send({ amount: 5000 });
    expect(resp.statusCode).toEqual(401);
  });
  test("bad request on no amount", async () => {
    await ApprovedRequest.enableFunding(3);
    const resp = await request(app)
      .patch("/approvedrequests/3/fund")
      .send({})
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request on negative amount", async () => {
    await ApprovedRequest.enableFunding(3);
    const resp = await request(app)
      .patch("/approvedrequests/3/fund")
      .send({ amount: -5000 })
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request on incorrect amount", async () => {
    await ApprovedRequest.enableFunding(3);
    const resp = await request(app)
      .patch("/approvedrequests/3/fund")
      .send({ amount: "incorrect" })
      .set("authorization", i1Token);
    expect(resp.statusCode).toEqual(400);
  });
});

describe("GET /approvedrequests/users/:userId", () => {
  test("works for correct user", async () => {
    const resp = await request(app)
      .get("/approvedrequests/users/2")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      approvedRequests: {
        borrower: [
          {
            id: 3,
            amtRequested: "10000",
            amtApproved: "9000",
            amtFunded: "0",
            purpose: "Home",
            appOpenDate: expect.any(String),
            appApprovedDate: expect.any(String),
            fundingDeadline: expect.any(String),
            interestRate: "0.05",
            term: 24,
            installmentAmt: "375.20",
            availableForFunding: false,
          },
          {
            id: 4,
            amtRequested: "20000",
            amtApproved: "18000",
            amtFunded: "0",
            purpose: "Car",
            appOpenDate: expect.any(String),
            appApprovedDate: expect.any(String),
            fundingDeadline: expect.any(String),
            interestRate: "0.07",
            term: 36,
            installmentAmt: "500.54",
            availableForFunding: false,
          },
        ],
      },
    });
  });
  test("works for authorized user", async () => {
    const resp = await request(app)
      .get("/approvedrequests/users/2")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(200);
  });
  test("unauth for non-user", async () => {
    const resp = await request(app).get("/approvedrequests/users/2");
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for incorrect user id", async () => {
    const resp = await request(app)
      .get("/approvedrequests/users/200")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(404);
  });
});
