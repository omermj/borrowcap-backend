"use strict";

const request = require("supertest");
const app = require("../../../app");
const ActiveRequest = require("../../../models/activeRequest");
const ApprovedRequest = require("../../../models/approvedRequest");
const CanncelledRequest = require("../../../models/cancelledRequest");
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
          id: 2,
          amtRequested: "10000",
          purpose: "Education",
          appOpenDate: expect.any(String),
          interestRate: "0.094",
          term: 36,
          installmentAmt: "319.86",
        },
        {
          id: 1,
          amtRequested: "5000",
          purpose: "Car",
          appOpenDate: expect.any(String),
          interestRate: "0.084",
          term: 24,
          installmentAmt: "226.14",
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
          id: 2,
          amtRequested: "10000",
          purpose: "Education",
          appOpenDate: expect.any(String),
          interestRate: "0.094",
          term: 36,
          installmentAmt: "319.86",
        },
        {
          id: 1,
          amtRequested: "5000",
          purpose: "Car",
          appOpenDate: expect.any(String),
          interestRate: "0.084",
          term: 24,
          installmentAmt: "226.14",
        },
      ],
    });
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

describe("PATCH /activerequests/:id", () => {
  const updateData = { amtRequested: 15000, interestRate: 0.09, term: "36" };
  test("works for admin", async () => {
    const resp = await request(app)
      .patch("/activerequests/1")
      .send(updateData)
      .set("authorization", u1Token);
    const activeRequest = await ActiveRequest.get(1);
    expect(resp.statusCode).toEqual(200);
    expect(activeRequest).toEqual({
      id: 1,
      borrowerId: 2,
      amtRequested: "15000",
      purposeId: 2,
      appOpenDate: expect.any(Date),
      interestRate: "0.09",
      term: 36,
      installmentAmt: "477",
      accountBalance: "50000",
      annualIncome: "100000",
      email: "b1@email.com",
      firstName: "B1First",
      lastName: "B1Last",
      otherMonthlyDebt: "2000",
      purpose: "Car",
      username: "b1",
    });
  });
  test("unauth for non-admin user", async () => {
    const resp = await request(app)
      .patch("/activerequests/1")
      .send(updateData)
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non user", async () => {
    const resp = await request(app).patch("/activerequests/1").send(updateData);
    expect(resp.statusCode).toEqual(401);
  });
  test("bad request on incorrect amount", async () => {
    updateData.amtRequested = -9000;
    const resp = await request(app)
      .patch("/activerequests/1")
      .send(updateData)
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request on incorrect purposeId", async () => {
    updateData.purposeId = 100;
    const resp = await request(app)
      .patch("/activerequests/1")
      .send(updateData)
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request on negative interest rate", async () => {
    updateData.interestRate = -0.049;
    const resp = await request(app)
      .patch("/activerequests/1")
      .send(updateData)
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request on interest rate > 100% ", async () => {
    updateData.interestRate = 1.2;
    const resp = await request(app)
      .patch("/activerequests/1")
      .send(updateData)
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request on incorrect term ", async () => {
    updateData.term = "100";
    const resp = await request(app)
      .patch("/activerequests/1")
      .send(updateData)
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(400);
  });
});

describe("DELETE /activerequests", () => {
  test("works for admin", async () => {
    const resp = await request(app)
      .delete("/activerequests/1")
      .set("authorization", u1Token);
    const activeRequests = await ActiveRequest.getAll();
    expect(resp.statusCode).toEqual(200);
    expect(activeRequests.length).toEqual(1);
  });
  test("unauth for non-admin", async () => {
    const resp = await request(app)
      .delete("/activerequests/1")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non-user", async () => {
    const resp = await request(app).delete("/activerequests/1");
    expect(resp.statusCode).toEqual(401);
  });
});

describe("PATCH /activerequests/:id/approve", () => {
  const approvalData = {
    amtApproved: 12000,
    interestRate: 0.084,
    term: "36",
  };
  test("works for admin", async () => {
    const resp = await request(app)
      .patch("/activerequests/1/approve")
      .send(approvalData)
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(201);

    // check if activeRequest is removed and approvedRequest is created
    await expect(ActiveRequest.get(1)).rejects.toThrow(NotFoundError);
    const approvedRequest = await ApprovedRequest.get(1);
    expect(approvedRequest).toEqual({
      amtApproved: "12000",
      amtFunded: "0",
      amtRequested: "5000",
      annualIncome: "100000",
      appApprovedDate: expect.any(Date),
      appOpenDate: expect.any(Date),
      availableForFunding: false,
      borrowerId: 2,
      fundingDeadline: expect.any(Date),
      id: 1,
      installmentAmt: "378.25",
      interestRate: "0.084",
      isFunded: false,
      otherMonthlyDebt: "2000",
      purpose: "Car",
      purposeId: 2,
      term: 36,
    });
  });
  test("unauth for non-admin user", async () => {
    const resp = await request(app)
      .patch("/activerequests/1/approve")
      .send(approvalData)
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non user", async () => {
    const resp = await request(app)
      .patch("/activerequests/1/approve")
      .send(approvalData);
    expect(resp.statusCode).toEqual(401);
  });
  test("bad request for incorrect amount", async () => {
    approvalData.amtApproved = -2000;
    const resp = await request(app)
      .patch("/activerequests/1/approve")
      .send(approvalData)
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request for interestRate", async () => {
    approvalData.interestRate = -0.04;
    const resp = await request(app)
      .patch("/activerequests/1/approve")
      .send(approvalData)
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request for incorrect term", async () => {
    approvalData.term = 100;
    const resp = await request(app)
      .patch("/activerequests/1/approve")
      .send(approvalData)
      .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(400);
  });
});

describe("PATCH /activerequests/1/reject", () => {
  test("works for admin", async () => {
    const resp = await request(app)
      .patch("/activerequests/1/reject")
      .set("authorization", u1Token);
    const activeRequests = await ActiveRequest.getAll();
    const cancelledRequest = await CanncelledRequest.get(1);
    expect(resp.statusCode).toEqual(200);
    expect(activeRequests.length).toEqual(1);
    expect(cancelledRequest.id).toEqual(1);
  });
  test("unauth for non-admin", async () => {
    const resp = await request(app)
      .patch("/activerequests/1/reject")
      .set("authorization", b1Token);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non user", async () => {
    const resp = await request(app).patch("/activerequests/1/reject");
    expect(resp.statusCode).toEqual(401);
  });
});
