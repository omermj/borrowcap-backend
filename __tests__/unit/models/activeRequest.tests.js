"use strict";

const User = require("../../../models/user.js");
const ActiveRequest = require("../../../models/activeRequest.js");
const db = require("../../../db.js");
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
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");

// // setup mock call to BoC interest rate API
// const mock = new MockAdapter(axios);
// mock
//   .onGet(
//     "https://www.bankofcanada.ca/valet/observations/group/bond_yields_benchmark/json"
//   )
//   .reply(200, {
//     observations: [
//       {
//         d: "2001-01-02",
//         "BD.CDN.RRB.DQ.YLD": {
//           v: "3.39",
//         },
//         "BD.CDN.3YR.DQ.YLD": {
//           v: "5.14",
//         },
//         "BD.CDN.10YR.DQ.YLD": {
//           v: "5.28",
//         },
//         "BD.CDN.2YR.DQ.YLD": {
//           v: "5.11",
//         },
//         "BD.CDN.7YR.DQ.YLD": {
//           v: "5.23",
//         },
//         "BD.CDN.5YR.DQ.YLD": {
//           v: "5.19",
//         },
//         "BD.CDN.LONG.DQ.YLD": {
//           v: "5.52",
//         },
//       },
//       {
//         d: "2001-01-03",
//         "BD.CDN.RRB.DQ.YLD": {
//           v: "3.39",
//         },
//         "BD.CDN.3YR.DQ.YLD": {
//           v: "5.14",
//         },
//         "BD.CDN.10YR.DQ.YLD": {
//           v: "5.28",
//         },
//         "BD.CDN.2YR.DQ.YLD": {
//           v: "5.11",
//         },
//         "BD.CDN.7YR.DQ.YLD": {
//           v: "5.23",
//         },
//         "BD.CDN.5YR.DQ.YLD": {
//           v: "5.19",
//         },
//         "BD.CDN.LONG.DQ.YLD": {
//           v: "5.52",
//         },
//       },
//     ],
//   });
// mock
//   .onGet("https://www.bankofcanada.ca/valet/observations/group/tbill_all/json")
//   .reply(200, {
//     observations: [
//       {
//         d: "2000-01-12",
//         V80691346: {
//           v: "5.84",
//         },
//         V80691345: {
//           v: "5.35",
//         },
//         V80691344: {
//           v: "4.98",
//         },
//         V80691342: {
//           v: "4.64",
//         },
//       },
//     ],
//   });

// setup before/after commands
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterAll(commonAfterAll);
afterEach(() => {
  // mock.reset();
  commonAfterEach;
});

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

describe("create", () => {
  const requestData = {
    borrowerId: 2,
    amtRequested: "25000",
    purposeId: 3,
    term: 48,
  };
  // expect(mock.history.get.length).toBe(2);
  test("works", async () => {
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
    ).rejects.toThrow(DatabaseError);
  });
});
