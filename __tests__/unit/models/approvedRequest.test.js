"use strict";

const ApprovedRequest = require("../../../models/approvedRequest");
const User = require("../../../models/user");
const FundedLoan = require("../../../models/fundedLoan");
const CancelledRequest = require("../../../models/cancelledRequest");

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
const { DatabaseError } = require("pg");

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

describe("create", () => {
  test("works", async () => {
    const requestData = {
      id: 5,
      borrowerId: 2,
      amtRequested: "10000",
      amtApproved: "8000",
      amtFunded: "0",
      purposeId: 1,
      appOpenDate: new Date("2023-09-01"),
      appApprovedDate: new Date("2023-09-05"),
      fundingDeadline: new Date("2023-10-05"),
      interestRate: "0.05",
      term: 36,
      installmentAmt: "230",
      availableForFunding: false,
      isFunded: false,
    };
    const approvedRequest = await ApprovedRequest.create(requestData);
    expect(approvedRequest).toEqual(requestData);
  });
  test("error on missing data", async () => {
    const requestData = {
      id: 5,
      borrowerId: 2,
      amtRequested: "10000",
      amtApproved: "8000",
      amtFunded: "0",
      purposeId: 1,
      appOpenDate: new Date("2023-09-01"),
      appApprovedDate: new Date("2023-09-05"),
      fundingDeadline: new Date("2023-10-05"),
    };
    await expect(ApprovedRequest.create(requestData)).rejects.toThrow(
      BadRequestError
    );
  });
});

describe("update", () => {
  test("works", async () => {
    const updateData = {
      interestRate: "0.06",
      term: 36,
    };
    const approvedRequest = await ApprovedRequest.get(3);
    delete approvedRequest.annualIncome;
    delete approvedRequest.otherMonthlyDebt;
    delete approvedRequest.purpose;
    const updatedApprovedRequest = await ApprovedRequest.update(3, updateData);
    expect(updatedApprovedRequest).toEqual({
      ...approvedRequest,
      ...updateData,
      purposeId: 1,
    });
  });
  test("throw error on incorrect data", async () => {
    const updateDate = {
      interestRate: "0.06",
      borrowerId: 10,
    };
    await expect(ApprovedRequest.update(3, updateDate)).rejects.toThrow(
      DatabaseError
    );
  });
  test("throw error on incorrect app id", async () => {
    await expect(ApprovedRequest.update(30, { term: 36 })).rejects.toThrow(
      NotFoundError
    );
  });
});

describe("cancel", () => {
  test("works", async () => {
    //Number of approvedRequests before cancellation
    let approvedRequests = await ApprovedRequest.getAll();
    const numReqBeforeCancel = approvedRequests.length;

    //cancel request
    const response = await ApprovedRequest.cancel(3);

    //Number of approvedRequests after cancellation
    approvedRequests = await ApprovedRequest.getAll();
    const numReqAfterCancel = approvedRequests.length;

    expect(response).toBe(true);
    expect(numReqAfterCancel).toEqual(numReqBeforeCancel - 1);

    // check if cancelledRequest is created in db
    const cancelledRequest = await CancelledRequest.getAll();
    console.log(cancelledRequest);
  });
  test("throw error on incorrect id", async () => {
    await expect(ApprovedRequest.cancel(30)).rejects.toThrow(NotFoundError);
  });
});

describe("enableFunding", () => {
  test("works", async () => {
    const response = await ApprovedRequest.enableFunding(3);
    const approvedRequest = await ApprovedRequest.get(3);
    expect(response).toBe(true);
    expect(approvedRequest.availableForFunding).toBe(true);
  });
  test("throw error on incorrect id", async () => {
    await expect(ApprovedRequest.enableFunding(30)).rejects.toThrow(
      NotFoundError
    );
  });
});

describe("delete", () => {
  test("works", async () => {
    //Number of approvedRequests before cancellation
    let approvedRequests = await ApprovedRequest.getAll();
    const numReqBeforeDelete = approvedRequests.length;

    //cancel request
    const response = await ApprovedRequest.delete(3);

    //Number of approvedRequests after cancellation
    approvedRequests = await ApprovedRequest.getAll();
    const numReqAfterDelete = approvedRequests.length;

    expect(response).toBe(true);
    expect(numReqAfterDelete).toEqual(numReqBeforeDelete - 1);
  });
  test("throw error on incorrect id", async () => {
    await expect(ApprovedRequest.delete(30)).rejects.toThrow(NotFoundError);
  });
});

describe("fund", () => {
  test("throw error if app id is incorrect", async () => {
    await ApprovedRequest.enableFunding(3);
    await expect(ApprovedRequest.fund(30, 3, 5000)).rejects.toThrow(
      NotFoundError
    );
  });
  test("throw error if approvedRequest is not available for funding", async () => {
    await expect(ApprovedRequest.fund(3, 3, 5000)).rejects.toThrow(
      ExpressError
    );
  });
  test("throw error if amount is greater than investable amount", async () => {
    await ApprovedRequest.enableFunding(3);
    await expect(ApprovedRequest.fund(3, 3, 10000)).rejects.toThrow(
      ExpressError
    );
  });
  test("throw error if investor does not have sufficient funds", async () => {
    await ApprovedRequest.enableFunding(3);
    await User.withdrawFunds(3, 49000);
    await expect(ApprovedRequest.fund(3, 3, 2000)).rejects.toThrow(
      ExpressError
    );
  });
  test("throw error if investor id is incorrect", async () => {
    await ApprovedRequest.enableFunding(3);
    await expect(ApprovedRequest.fund(3, 30, 5000)).rejects.toThrow(
      NotFoundError
    );
  });

  test("works - partial funding", async () => {
    await ApprovedRequest.enableFunding(3);
    await ApprovedRequest.fund(3, 3, 2000);
    const approvedRequest = await ApprovedRequest.get(3);

    // amtFunded field is updated in db
    expect(approvedRequest.amtFunded).toEqual("2000");

    // investor balance is updated
    const investor = await User.get(3);
    expect(investor.accountBalance).toEqual("48000");

    // investor pledge is updated in db
    const investorPledges = await ApprovedRequest.getApprovedRequestsByUserId(
      3
    );
    expect(investorPledges.investor.length).toEqual(1);
    expect(investorPledges.investor[0].amtPledged).toEqual("2000");
  });
  test("works - full funding", async () => {
    await ApprovedRequest.enableFunding(3);
    await ApprovedRequest.fund(3, 3, 9000);

    // isFunded and availableForFunding properties are updated
    const approvedRequest = await ApprovedRequest.get(3);
    expect(approvedRequest.isFunded).toBe(true);
    expect(approvedRequest.availableForFunding).toBe(false);

    // fundedLoan entry is created
    const fundedLoan = await FundedLoan.get(3);
    expect(fundedLoan.amtFunded).toEqual("9000");
  });
});

describe("addInvestorPledge", () => {
  test("works", async () => {
    await ApprovedRequest.addInvestorPledge(3, 3, 2000);
    const investorPledges = await ApprovedRequest.getApprovedRequestsByUserId(
      3
    );
    expect(investorPledges.investor.length).toEqual(1);
    expect(investorPledges.investor[0].amtPledged).toEqual("2000");
  });
  test("throw error on incorrect app id", async () => {
    await expect(
      ApprovedRequest.addInvestorPledge(30, 3, 2000)
    ).rejects.toThrow(NotFoundError);
  });
  test("throw error on incorrect investor id", async () => {
    await expect(
      ApprovedRequest.addInvestorPledge(3, 30, 2000)
    ).rejects.toThrow(NotFoundError);
  });
});

describe("getAvailableForInvestment", () => {
  test("works", async () => {
    let available = await ApprovedRequest.getAvailableForInvestment();
    expect(available.length).toEqual(0);

    await ApprovedRequest.enableFunding(3);
    available = await ApprovedRequest.getAvailableForInvestment();
    expect(available.length).toEqual(1);

    await ApprovedRequest.fund(3, 3, 9000);
    available = await ApprovedRequest.getAvailableForInvestment();
    expect(available.length).toEqual(0);
  });
});

describe("getApprovedRequestsByUserId", () => {
  test("works for borrower", async () => {
    const forBorrower = await ApprovedRequest.getApprovedRequestsByUserId(2);
    expect(forBorrower).toEqual({
      borrower: [
        {
          id: 3,
          amtRequested: "10000",
          amtApproved: "9000",
          amtFunded: "0",
          purpose: "Home",
          appOpenDate: expect.any(Date),
          appApprovedDate: expect.any(Date),
          fundingDeadline: expect.any(Date),
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
          appOpenDate: expect.any(Date),
          appApprovedDate: expect.any(Date),
          fundingDeadline: expect.any(Date),
          interestRate: "0.07",
          term: 36,
          installmentAmt: "500.54",
          availableForFunding: false,
        },
      ],
    });
  });
  test("works for investor", async () => {
    let forInvestor = await ApprovedRequest.getApprovedRequestsByUserId(3);
    expect(forInvestor.investor.length).toEqual(0);

    await ApprovedRequest.enableFunding(3);
    await ApprovedRequest.fund(3, 3, 4000);

    forInvestor = await ApprovedRequest.getApprovedRequestsByUserId(3);
    expect(forInvestor.investor.length).toEqual(1);
    expect(forInvestor).toEqual({
      investor: [
        {
          id: 3,
          amtApproved: "9000",
          amtPledged: "4000",
          approvedDate: expect.any(Date),
          fundingDeadline: expect.any(Date),
          interestRate: "0.05",
          term: 24,
        },
      ],
    });
  });
  test("incorrect user role (not investor or borrower)", async () => {
    await expect(
      ApprovedRequest.getApprovedRequestsByUserId(1)
    ).rejects.toThrow(BadRequestError);
  });
  test("incorrect user id", async () => {
    await expect(
      ApprovedRequest.getApprovedRequestsByUserId(300)
    ).rejects.toThrow(NotFoundError);
  });
});
