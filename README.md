# BorrowCap - P2P Lending Solution

## Introduction
BorrowCap is a modernize take on how lending should work in 21st century. It is a P2P lending solution which enables willing investors to directly fund potential borrowers. 

As a borrower, you can request a loan, which will be reviewed by a qualified underwriter from BorrowCap. After being approved, the loan will be made available to a wide pool of individual investors, who can choose to fund a part of the loan or the full amount. Once successfully funded, the amount will be immediately available in your wallet.

As an investor, you can invest in multiple loans from multiple investors. You can diversify your investment accross many borrowers and choose to invest as little or as much as you want. This can create a well diversified alternative income stream for you.


## Features and User Flow
1. **User authentication with multiple roles:** A user can register as an Investor or a Borrower. Admin roles (called underwriters) are also pre-established and have control over loan application review process.
2. **Loan Application Process:** Registered borrowers can apply for loans, specifying requested amount, purpose of loan and requested term (duration) of loan.
3. **Application Approval:** All loan applications go the underwriter(s) for approval. They have access to detailed borrower information like annual income, other monthly debts and account balances to help them make their decision. Underwriters can override user requested loan amounts (approve lower/higher amounts), suggested interest rates (higher interest rates for riskier borrowers) and loan terms.
4. **Investments:** Once application is approved by underwriter and borrower accepts underwriter changes, the loan application becomes visible on investors' dasboards. Each investor can choose to fund the loan either partially or fully.
5. **Funded Loans:** After reaching the funding goal, an application becomes a "Funded Loan". Borrowers must pay installments every month, which are transferred to all investors in their respective investment proportions. A loan gets fully paid once all installments are duly paid.
6. **User Wallet:** Borrowers and Investors get their own digital wallets. They can deposit and withdraw funds from their wallets. An investor must have enough funds in the wallet before pledging an investment amount for a specific loan. When a loan request gets funded fully, the loan amount is transferred to borrower's wallet. Borrower pays loan installments from the wallet.
7. **Realtime Market Interest Rates:** In order to assign fair and market driven interest rates to loan applications, Bank of Canada's API is used to acquire most recent yields of Canada Government Bonds and Bills. The bond yields are then marked up (to reflect credit risk) in order to assign a suitable interest rate to a loan application.


## Technical Stack
### Frontend
- Framework: React.js
- Libraries and tools: React Router, Axios, Bootstrap, JWT, Formik

### Backend
- Framework: Express.js on Node.js
- Database: PostgreSQL
- Authentication: JWT
- Password Hasing: Bcrypt
- Backend Form Validation: JSON Web Schema
- API Calls: Axios

## Frontend React App
- Frontend React App for BorrowCap can be accessed here: [BorrowCap-Frontend](https://github.com/codersixteen/borrowcap-frontend)

## Installation instructions
1. Clone the repo to your local machine
   
    `$ git clone https://github.com/codersixteen/borrowcap-backend.git`

2. Install required packages

    `$ npm install`

3. Initialize the database. Please do install PostreSQL if you don't have it installed. Database user and password can be changed in the config.js file.
   
   `$ psql < borrowcap-init.sql`

4. Run the app

    `$ npm run dev`