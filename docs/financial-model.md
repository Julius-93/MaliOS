# MaliOS Financial Model

## Purpose

MaliOS is a personal financial operating system designed to help users manage money, understand their financial position, invest across multiple asset classes, and achieve financial goals.

## Core Domains

### Users

A user owns and controls their financial data.

### Accounts

Accounts represent places where money is held or managed.

Examples:
- Bank accounts
- Mobile money
- Cash
- Credit cards

### Transactions

Transactions represent financial events that increase or decrease an account balance.

Examples:
- Income
- Expenses
- Transfers
- Investments
- Loan payments

### Assets

Assets represent things owned by the user with financial value.

Examples:
- Cash
- Bank deposits
- Investments
- Property
- Vehicles
- Business interests

### Liabilities

Liabilities represent financial obligations owed by the user.

Examples:
- Loans
- Mortgages
- Credit cards
- Overdrafts

### Investments

Investments represent financial instruments and holdings.

Supported categories will eventually include:
- Stocks
- Bonds
- ETFs
- Money Market Funds
- Mutual Funds
- Treasury securities
- Real estate
- Other investments

### Goals

Goals represent financial objectives.

Examples:
- Emergency fund
- House deposit
- Vehicle
- Education
- Retirement

### Budgets

Budgets define planned spending, saving and investing allocations.

### Financial Health

Financial Health provides an analytical assessment of the user's financial position.

Potential factors:
- Cash flow
- Savings rate
- Emergency fund
- Debt management
- Investment diversification
- Goal progress

## Core Financial Formula

Net Worth = Total Assets - Total Liabilities

## Ledger Principle

Financial balances should be derived from an auditable transaction history wherever practical rather than relying solely on mutable balance fields.

## Security Principle

MaliOS cannot guarantee that a system is completely unhackable.

The security objective is defense in depth using:
- Strong authentication
- Authorization
- Encryption
- Least privilege
- Secure API design
- Audit logging
- Monitoring
- Rate limiting
- Secure secrets management
- Dependency scanning
- Backups and disaster recovery

## Architecture Direction

The system will eventually consist of:

Web Application
Mobile Application
API Backend
Authentication Service
Financial Ledger
Investment Service
Financial Analytics Engine
PostgreSQL Database
External Financial Integrations

## Database Model

### Core Entities

The initial database model will contain the following core entities:

- users
- accounts
- transactions
- categories
- budgets
- budget_items
- goals
- liabilities
- investment_instruments
- holdings

### Supporting Entities

The system will eventually include:

- institutions
- currencies
- exchange_rates
- sessions
- devices
- security_events
- audit_logs
- notifications

### Relationships

A user can have many accounts.

A user can have many transactions through their accounts.

A user can have many goals.

A user can have many liabilities.

A user can have many investment holdings.

An investment instrument can be held by many users.

An account can have many transactions.

A category can be associated with many transactions.

### Financial Calculations

Net Worth:

Total Assets - Total Liabilities

Account Balance:

Opening Balance + Credits - Debits

Portfolio Value:

Sum of current market value of holdings

Investment Return:

Current Value - Cost Basis

Financial Health:

Calculated from multiple financial indicators rather than a single stored value.

### Data Integrity

Financial records should be immutable wherever possible.

Corrections should preferably be represented by adjustment/reversal transactions rather than silently modifying historical financial records.

Financial calculations should use appropriate decimal/numeric database types rather than floating point values.

All financial records must be associated with the appropriate user through authorization-controlled relationships.

### Security

Financial data must never be exposed solely because a client knows an object ID.

Every backend request accessing financial data must verify that the authenticated user is authorized to access the requested resource.

Security-sensitive operations must be auditable.

Authentication and authorization will be enforced by the backend rather than trusted to the frontend.
