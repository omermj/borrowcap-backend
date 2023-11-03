"use strict";

const ApprovedRequest = require("../../../models/approvedRequest");

const {
  ExpressError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} = require("../../../expressError");
const {
  commonAfterAll,
  commonAfterEach,
  commonBeforeAll,
  commonBeforeEach,
} = require("./_testCommon");

// setup before/after commands
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterAll(commonAfterAll);
afterEach(commonAfterEach);

describe("getAll", () => {
  test("works", async () => {
    const approvedRequests = await ApprovedRequest.getAll();
    expect(approvedRequests).toEqual([
      {
        amtApproved: "9000",
        amtFunded: "0",
        amtRequested: "10000",
        appApprovedDate: new Date("2023/09/26"),
        appOpenDate: new Date("2023/09/25"),
        availableForFunding: false,
        borrowerId: 2,
        fundingDeadline: new Date("2023/10/26"),
        id: 3,
        installmentAmt: "375.20",
        interestRate: "0.05",
        isFunded: false,
        purpose: "Home",
        purposeId: 1,
        term: 24,
      },
      {
        amtApproved: "18000",
        amtFunded: "0",
        amtRequested: "20000",
        appApprovedDate: new Date("2023/09/27"),
        appOpenDate: new Date("2023/09/26"),
        availableForFunding: false,
        borrowerId: 2,
        fundingDeadline: new Date("2023/10/27"),
        id: 4,
        installmentAmt: "500.54",
        interestRate: "0.07",
        isFunded: false,
        purpose: "Car",
        purposeId: 2,
        term: 36,
      },
    ]);
  });
});

describe("get", () => {
  test("works", async () => {
    const approvedRequest = await ApprovedRequest.get(3);
    expect(approvedRequest).toEqual({
      amtApproved: "9000",
      amtFunded: "0",
      amtRequested: "10000",
      appApprovedDate: new Date("2023/09/26"),
      appOpenDate: new Date("2023/09/25"),
      availableForFunding: false,
      borrowerId: 2,
      fundingDeadline: new Date("2023/10/26"),
      id: 3,
      installmentAmt: "375.20",
      interestRate: "0.05",
      isFunded: false,
      purpose: "Home",
      term: 24,
      annualIncome: "100000",
      otherMonthlyDebt: "2000",
    });
  });
  test("throw error on incorrect id", async () => {
    await expect(ApprovedRequest.get(100)).rejects.toThrow(NotFoundError);
  });
});
