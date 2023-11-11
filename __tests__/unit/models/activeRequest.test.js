"use strict";

const ActiveRequest = require("../../../models/activeRequest.js");

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
const { getInterestRates } = require("../../../helpers/interestRate.js");
const ApprovedRequest = require("../../../models/approvedRequest.js");

jest.mock("../../../helpers/interestRate.js");

// setup before/after commands
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterAll(commonAfterAll);
afterEach(commonAfterEach);

describe("getAll", () => {
  test("works", async () => {
    const activeRequests = await ActiveRequest.getAll();
    expect(activeRequests).toEqual([
      {
        id: 1,
        borrowerId: 2,
        amtRequested: "5000",
        purpose: "Car",
        purposeId: 2,
        appOpenDate: new Date("2023/09/27"),
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
        appOpenDate: new Date("2023/09/28"),
        interestRate: "0.094",
        term: 36,
        installmentAmt: "319.86",
      },
    ]);
  });
});

describe("get", () => {
  test("works", async () => {
    const activeRequest = await ActiveRequest.get(1);
    expect(activeRequest).toEqual({
      id: 1,
      borrowerId: 2,
      amtRequested: "5000",
      purpose: "Car",
      purposeId: 2,
      appOpenDate: new Date("2023/09/27"),
      interestRate: "0.084",
      term: 24,
      installmentAmt: "226.14",
      username: "b1",
      firstName: "B1First",
      lastName: "B1Last",
      email: "b1@email.com",
      accountBalance: "50000",
      annualIncome: "100000",
      otherMonthlyDebt: "2000",
    });
  });
  test("error if incorrect activeRequest id", async () => {
    await expect(ActiveRequest.get(100)).rejects.toThrow(NotFoundError);
  });
});

describe("getByBorrowerId", () => {
  test("works", async () => {
    const activeRequests = await ActiveRequest.getByBorrowerId(2);
    await expect(activeRequests).toEqual([
      {
        id: 1,
        amtRequested: "5000",
        purpose: "Car",
        appOpenDate: new Date("2023/09/27"),
        interestRate: "0.084",
        term: 24,
        installmentAmt: "226.14",
      },
      {
        id: 2,
        amtRequested: "10000",
        purpose: "Education",
        appOpenDate: new Date("2023/09/28"),
        interestRate: "0.094",
        term: 36,
        installmentAmt: "319.86",
      },
    ]);
  });
  test("throw error on incorrect borrower id", async () => {
    await expect(ActiveRequest.getByBorrowerId(100)).rejects.toThrow(
      NotFoundError
    );
  });
});

describe("create", () => {
  const requestData = {
    borrowerId: 2,
    amtRequested: "25000",
    purposeId: 3,
    term: 60,
  };

  test("works", async () => {
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
    const noOfActiveRequestsBefore = activeRequests.length;
    const activeRequest = await ActiveRequest.create({ ...requestData });
    activeRequests = await ActiveRequest.getAll();
    const noOfActiveRequestsAfter = activeRequests.length;

    expect(noOfActiveRequestsAfter).toEqual(noOfActiveRequestsBefore + 1);
    expect(activeRequest).toEqual({
      ...requestData,
      id: expect.any(Number),
      appOpenDate: expect.any(Date),
      interestRate: expect.any(String),
      installmentAmt: expect.any(String),
    });
  });

  test("error on missing data", async () => {
    await expect(
      ActiveRequest.create({ borrowerId: 2, term: 48 })
    ).rejects.toThrow(BadRequestError);
  });

  test("error on incorrect borrowerId", async () => {
    await expect(
      ActiveRequest.create({ borrowerId: 100, term: 48 })
    ).rejects.toThrow(BadRequestError);
  });
});

describe("update", () => {
  test("works", async () => {
    await ActiveRequest.update(1, { amtRequested: 20000, term: 60 });
    const updatedRequest = await ActiveRequest.get(1);
    expect(updatedRequest).toEqual({
      id: 1,
      borrowerId: 2,
      amtRequested: "20000",
      purpose: "Car",
      purposeId: 2,
      appOpenDate: new Date("2023/09/27"),
      interestRate: "0.084",
      term: 60,
      installmentAmt: "409.37",
      username: "b1",
      firstName: "B1First",
      lastName: "B1Last",
      email: "b1@email.com",
      accountBalance: "50000",
      annualIncome: "100000",
      otherMonthlyDebt: "2000",
    });
  });

  test("error on disallowed update items", async () => {
    await expect(
      ActiveRequest.update(1, { borrowerId: 100, installmentAmt: 500 })
    ).rejects.toThrow(BadRequestError);
  });
});

describe("delete", () => {
  test("works", async () => {
    let activeRequests = await ActiveRequest.getAll();
    const noOfActiveRequestsBefore = activeRequests.length;
    const activeRequest = await ActiveRequest.delete(1);
    activeRequests = await ActiveRequest.getAll();
    const noOfActiveRequestsAfter = activeRequests.length;

    expect(noOfActiveRequestsAfter).toEqual(noOfActiveRequestsBefore - 1);
  });

  test("error on incorrect id", async () => {
    await expect(ActiveRequest.delete(100)).rejects.toThrow(NotFoundError);
  });
});

describe("approve", () => {
  test("works", async () => {
    const approvalData = {
      interestRate: "0.06",
      amtApproved: "8000",
      term: "36",
    };
    // app removed from ActiveRequest table
    let activeRequests = await ActiveRequest.getAll();
    let approvedRequests = await ApprovedRequest.getAll();
    const noOfActiveRequestsBefore = activeRequests.length;
    const noOfApprovedRequestsBefore = approvedRequests.length;

    await ActiveRequest.approve(1, approvalData);

    activeRequests = await ActiveRequest.getAll();
    approvedRequests = await ApprovedRequest.getAll();
    const noOfActiveRequestsAfter = activeRequests.length;
    const noOfApprovedRequestsAfter = approvedRequests.length;

    expect(noOfActiveRequestsAfter).toEqual(noOfActiveRequestsBefore - 1);
    expect(noOfApprovedRequestsAfter).toEqual(noOfApprovedRequestsBefore + 1);

    // app added to ApprovedRequest table
    const approvedRequest = await ApprovedRequest.get(1);
    expect(approvedRequest).toEqual({
      id: 1,
      borrowerId: 2,
      amtRequested: "5000",
      amtApproved: "8000",
      amtFunded: "0",
      purpose: "Car",
      appOpenDate: expect.any(Date),
      appApprovedDate: expect.any(Date),
      fundingDeadline: expect.any(Date),
      interestRate: "0.06",
      term: 36,
      installmentAmt: "243.38",
      availableForFunding: false,
      isFunded: false,
      annualIncome: "100000",
      otherMonthlyDebt: "2000",
    });
  });

  // incorrect data
  test("error if update data is incorrect", async () => {
    const approvalData1 = {
      interestRate: "0.06",
      amtApproved: "-8000",
      term: "36",
    };
    await expect(ActiveRequest.approve(1, approvalData1)).rejects.toThrow(
      BadRequestError
    );

    const approvalData2 = {
      interestRate: "wrong",
      amtApproved: "8000",
      term: "36",
    };
    await expect(ActiveRequest.approve(1, approvalData2)).rejects.toThrow(
      BadRequestError
    );

    const approvalData3 = {
      interestRate: "0.06",
      amtApproved: "8000",
      term: "72",
    };
    await expect(ActiveRequest.approve(1, approvalData3)).rejects.toThrow(
      BadRequestError
    );
  });

  // incorrect app id
  test("error if update data is incorrect", async () => {
    const approvalData = {
      interestRate: "0.06",
      amtApproved: "8000",
      term: "36",
    };
    await expect(ActiveRequest.approve(100, approvalData)).rejects.toThrow(
      NotFoundError
    );
  });
});

describe("calculatePayment", () => {
  test("works", () => {
    expect(ActiveRequest.calculatePayment(10000, 0.05 / 12, 48)).toEqual(
      230.29
    );
  });
  test("throw error on incorrect arguments", () => {
    expect(() =>
      ActiveRequest.calculatePayment("wrong", 0.05 / 12, 48)
    ).toThrow(BadRequestError);
  });
});

describe("validateApprovalData", () => {
  test("works", () => {
    const data = {
      interestRate: 0.06,
      amtApproved: 10000,
      term: "48",
    };
    expect(ActiveRequest.validateApprovalData(data)).toBe(true);
  });
  test("error on incorrect interestRate", () => {
    const data1 = {
      interestRate: -0.06,
      amtApproved: 10000,
      term: "48",
    };
    expect(ActiveRequest.validateApprovalData(data1)).toBe(false);

    const data2 = {
      interestRate: "string",
      amtApproved: 10000,
      term: "48",
    };
    expect(ActiveRequest.validateApprovalData(data2)).toBe(false);

    const data3 = {
      interestRate: 1.15,
      amtApproved: 10000,
      term: "48",
    };
    expect(ActiveRequest.validateApprovalData(data3)).toBe(false);
  });

  test("error on incorrect amtApproved", () => {
    const data1 = {
      interestRate: 0.06,
      amtApproved: -10000,
      term: "48",
    };
    expect(ActiveRequest.validateApprovalData(data1)).toBe(false);

    const data2 = {
      interestRate: 0.06,
      amtApproved: "wrong-amount",
      term: "48",
    };
    expect(ActiveRequest.validateApprovalData(data2)).toBe(false);
  });

  test("error on incorrect term", () => {
    const data1 = {
      interestRate: 0.06,
      amtApproved: 10000,
      term: 3,
    };
    expect(ActiveRequest.validateApprovalData(data1)).toBe(false);

    const data2 = {
      interestRate: 0.06,
      amtApproved: 10000,
      term: "65",
    };
    expect(ActiveRequest.validateApprovalData(data2)).toBe(false);

    const data3 = {
      interestRate: 0.06,
      amtApproved: 10000,
      term: "-24",
    };
    expect(ActiveRequest.validateApprovalData(data3)).toBe(false);
  });
});
