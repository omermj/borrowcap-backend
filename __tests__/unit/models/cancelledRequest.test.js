"use strict";

const CancelledRequest = require("../../../models/cancelledRequest");
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
const { DatabaseError } = require("pg");

// setup before/after commands
beforeAll(commonBeforeAll);
afterAll(commonAfterAll);
afterEach(commonAfterEach);
beforeEach(commonBeforeEach);

const newCancelledRequestData = {
  id: 5,
  borrowerId: 2,
  amtRequested: 8000,
  amtApproved: 0,
  purposeId: 1,
  appOpenDate: new Date().toUTCString(),
  appApprovedDate: null,
  appCancelledDate: new Date().toUTCString(),
  fundingDeadline: null,
  interestRate: 0.08,
  term: "36",
  installmentAmt: 360,
  wasApproved: false,
  cancellationReasonId: 1,
};

describe("create", () => {
  test("works", async () => {
    const cancelledRequest = await CancelledRequest.create(
      newCancelledRequestData
    );
    expect(cancelledRequest).toEqual({
      id: 5,
      borrowerId: 2,
      amtRequested: "8000",
      amtApproved: "0",
      purposeId: 1,
      appOpenDate: expect.any(Date),
      appApprovedDate: null,
      appCancelledDate: expect.any(Date),
      fundingDeadline: null,
      interestRate: "0.08",
      term: 36,
      installmentAmt: "360",
      wasApproved: false,
      cancellationReasonId: 1,
    });
  });
  test("error on missing data", async () => {
    const incorrectData = { ...newCancelledRequestData };
    delete incorrectData.term;
    await expect(CancelledRequest.create(incorrectData)).rejects.toThrow(
      DatabaseError
    );
  });
});

describe("getAll", () => {
  test("works", async () => {
    await CancelledRequest.create(newCancelledRequestData);
    const cancelledRequests = await CancelledRequest.getAll();
    expect(cancelledRequests).toEqual([
      {
        id: 5,
        borrowerId: 2,
        amtRequested: "8000",
        amtApproved: "0",
        purposeId: 1,
        purpose: "Home",
        appOpenDate: expect.any(Date),
        appApprovedDate: null,
        appCancelledDate: expect.any(Date),
        interestRate: "0.08",
        term: 36,
        installmentAmt: "360",
        wasApproved: false,
        cancellationReasonId: 1,
      },
    ]);
  });
});

describe("get", () => {
  test("works", async () => {
    await CancelledRequest.create(newCancelledRequestData);
    const cancelledRequest = await CancelledRequest.get(5);
    expect(cancelledRequest).toEqual({
      id: 5,
      borrowerId: 2,
      amtRequested: "8000",
      amtApproved: "0",
      purposeId: 1,
      purpose: "Home",
      appOpenDate: expect.any(Date),
      appApprovedDate: null,
      appCancelledDate: expect.any(Date),
      interestRate: "0.08",
      term: 36,
      installmentAmt: "360",
      wasApproved: false,
      cancellationReasonId: 1,
    });
  });
  test("error on incorrect id", async () => {
    await expect(CancelledRequest.get(9999)).rejects.toThrow(NotFoundError);
  });
});
