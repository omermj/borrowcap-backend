const { BadRequestError } = require("../expressError");

function generateUpdateQuery(data, jsToSql) {
  const keys = Object.keys(data);

  if (!keys.length) throw BadRequestError("No data.");

  const cols = keys.map(
    (colName, idx) => `${jsToSql[colName] || colName} = $${idx + 1}`
  );

  return {
    cols: cols,
    values: Object.values(data),
  };
}

const d = { firstName: "Omer", lastName: "Jawwad", accountBalance: 40000 };
const m = {
  firstName: "first_name",
  lastName: "last_name",
  accountBalance: "account_balance",
};


module.exports = { generateUpdateQuery };
