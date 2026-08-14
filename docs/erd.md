# MaliOS Entity Relationship Model

## Core Entities

### Users

Represents a MaliOS user.

Relationships:

- One user can have many accounts.
- One user can have many transactions through their accounts.
- One user can have many goals.
- One user can have many liabilities.
- One user can have many budgets.
- One user can have many holdings.

### Accounts

Represents a financial account controlled by a user.

Examples:

- Bank account
- Mobile money
- Cash
- Credit card

Relationship:

User 1 → Many Accounts

### Transactions

Represents a financial event associated with an account.

Examples:

- Income
- Expense
- Transfer
- Investment contribution
- Loan payment

Relationship:

Account 1 → Many Transactions

### Categories

Represents transaction classification.

Examples:

- Food
- Transport
- Housing
- Utilities
- Salary
- Investment

Categories may support parent/child relationships.

### Budgets

Represents a financial plan for a defined period.

Relationship:

User 1 → Many Budgets

### Budget Items

Represents individual planned allocations inside a budget.

Relationship:

Budget 1 → Many Budget Items

### Goals

Represents a financial objective.

Examples:

- Emergency fund
- House deposit
- Vehicle
- Education
- Retirement

Relationship:

User 1 → Many Goals

### Liabilities

Represents money owed by the user.

Examples:

- Personal loan
- Mortgage
- Credit card
- Car loan

Relationship:

User 1 → Many Liabilities

## Investment Domain

### Investment Instruments

Represents an investment product or financial instrument.

Examples:

- Stock
- Bond
- ETF
- Money Market Fund
- Mutual Fund
- Treasury security

### Holdings

Represents a user's ownership position in an investment instrument.

Relationships:

Investment Instrument 1 → Many Holdings

User 1 → Many Holdings

### Market Prices

Represents price observations for investment instruments.

Market prices are separate from holdings because prices change over time.

## Core Relationships

User
→ Accounts
→ Transactions

User
→ Budgets
→ Budget Items

User
→ Goals

User
→ Liabilities

User
→ Holdings
→ Investment Instruments
→ Market Prices

## Financial Principles

Net Worth = Total Assets - Total Liabilities

Account balances should be derived from an auditable financial history wherever practical.

Investment value should be calculated using current market prices and the user's holdings.

Historical investment prices must not be overwritten.

Financial records should maintain auditability.

## Security Principles

All user-owned financial entities must be protected by server-side authorization.

A client must never gain access to another user's data simply by changing an entity ID.

Financial operations must be auditable.

Sensitive authentication and security information must be separated from financial domain data.
