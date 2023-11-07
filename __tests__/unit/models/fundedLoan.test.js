"use strict";

const ApprovedRequest = require("../../../models/approvedRequest");
const User = require("../../../models/user");
const FundedLoan = require("../../../models/fundedLoan");

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

// helper function: fund approvedRequest with id of 3
const fundRequestForTesting = async () => {
  await ApprovedRequest.enableFunding(3);
  await ApprovedRequest.fund(3, 3, 9000);
};

describe("getAll", () => {
  test("works", async () => {
    await fundRequestForTesting();
    const fundedLoans = await FundedLoan.getAll();
    expect(fundedLoans).toEqual([
      {
        id: 3,
        borrowerId: 2,
        amtFunded: "9000",
        fundedDate: expect.any(Date),
        interestRate: "0.05",
        term: 24,
        installmentAmt: "375.20",
        remainingBalance: "9000",
      },
    ]);
  });
});

describe("get", () => {
  test("get", async () => {
    await fundRequestForTesting();
    const fundedLoan = await FundedLoan.get(3);
    expect(fundedLoan).toEqual({
      id: 3,
      borrowerId: 2,
      amtFunded: "9000",
      fundedDate: expect.any(Date),
      interestRate: "0.05",
      term: 24,
      installmentAmt: "375.20",
      remainingBalance: "9000",
    });
  });
  test("throw error on incorrect id", async () => {
    await expect(FundedLoan.get(300)).rejects.toThrow(NotFoundError);
  });
});

describe("create", () => {
  test("works", async () => {
    await fundRequestForTesting();
    const fundedLoans = await FundedLoan.getAll();
    expect(fundedLoans.length).toEqual(1);
  });
  test("investors updated", async () => {
    await fundRequestForTesting();
    const users = await FundedLoan.getFundedLoansByUserId(3);
    expect(users.investor[0].id).toEqual(3);
    expect(users.investor[0].amtInvested).toEqual("9000");
  });
  test("funds deposited to borrower's wallet", async () => {
    let borrower = await User.get(2);
    const accountBalanceBefore = +borrower.accountBalance;
    await fundRequestForTesting();
    borrower = await User.get(2);
    const accountBalanceAfter = +borrower.accountBalance;
    expect(accountBalanceAfter).toEqual(accountBalanceBefore + 9000);
  });
  test("throw error on incorrect data", async () => {
    const incorrectData = {
      id: 300,
      borrowerId: 2,
      amtFunded: "9000",
      fundedDate: new Date(),
      interestRate: "0.05",
      term: 24,
      installmentAmt: "375.20",
      remainingBalance: "9000",
    };
    await expect(FundedLoan.create(incorrectData)).rejects.toThrow(
      BadRequestError
    );
    incorrectData.id = 3;
    incorrectData.borrowerId = 300;
    await expect(FundedLoan.create(incorrectData)).rejects.toThrow(
      BadRequestError
    );
  });
});

describe("updateInvestorsForFundedLoan", () => {
  test("works", async () => {
    await fundRequestForTesting();
    const users = await FundedLoan.getFundedLoansByUserId(3);
    expect(users.investor[0].id).toEqual(3);
    expect(users.investor[0].investorId).toEqual(3);
  });
});

describe("payInstallment", () => {
  test("works", async () => {
    await fundRequestForTesting();
    let fundedLoan = await FundedLoan.get(3);

    // check borrower and investor balances before paying installment
    let borrower = await User.get(2);
    const borrowerBalance = +borrower.accountBalance;
    let investor = await User.get(3);
    const investorBalance = +investor.accountBalance;

    // calculate principal amount
    let interest =
      (+fundedLoan.remainingBalance * +fundedLoan.interestRate) / 12;
    interest = interest.toFixed(2);
    let principal = +fundedLoan.installmentAmt - interest;

    await FundedLoan.payInstallment(3);

    // update borrower and investor after paying installment
    borrower = await User.get(2);
    investor = await User.get(3);

    expect(+borrower.accountBalance).toEqual(
      borrowerBalance - +fundedLoan.installmentAmt
    );
    expect(+investor.accountBalance).toEqual(
      investorBalance + +fundedLoan.installmentAmt
    );

    // check remaining balance of loan
    fundedLoan = await FundedLoan.get(3);
    expect(+fundedLoan.remainingBalance).toEqual(
      +fundedLoan.amtFunded - principal
    );
  });
  test("throw error on incorrect app id", async () => {
    await expect(FundedLoan.payInstallment(300)).rejects.toThrow(NotFoundError);
  });
  test("throw error if borrower does not have sufficient funds", async () => {
    await fundRequestForTesting();
    await User.withdrawFunds(2, 58900);
    await expect(FundedLoan.payInstallment(3)).rejects.toThrow(BadRequestError);
  });
});

describe("payOffLoan", () => {
  test("works", async () => {
    await fundRequestForTesting();
    for (let i = 0; i < 26; i++) {
      await FundedLoan.payInstallment(3);
    }
    // fundedLoan is deleted after pay off
    await expect(FundedLoan.get(3)).rejects.toThrow(NotFoundError);

    // new entry for paidOffLoan
  });
});
