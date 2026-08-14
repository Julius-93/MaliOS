# MaliOS System Architecture

## 1. Overview

MaliOS is a personal financial operating system designed to help users manage their money, understand their financial health, manage financial goals and investments, and receive financial insights.

The system will support web and mobile applications using a shared backend API.

## 2. Applications

### Web Application

Technology:

- React
- Vite

Location:

`frontend/`

### Backend API

Technology:

- Node.js
- Express
- Prisma
- PostgreSQL

Location:

`backend/`

### Mobile Application

Technology:

- React Native
- Expo

Location:

`mobile/`

## 3. High-Level Architecture

User
↓
Web / Mobile Application
↓
HTTPS API
↓
Node.js / Express Backend
↓
Application Services
↓
Prisma ORM
↓
PostgreSQL

## 4. Core Financial Domains

MaliOS will contain the following major domains:

- Authentication
- Users
- Financial Accounts
- Transactions
- Budgets
- Goals
- Assets
- Liabilities
- Net Worth
- Investments
- Portfolio Management
- Financial Health
- Notifications
- AI Financial Copilot

## 5. Financial Account Model

A user can have multiple financial accounts.

Examples:

- Bank account
- Mobile money account
- SACCO account
- Cash account
- Investment account

Each account may contain multiple financial transactions.

Relationship:

User → Accounts → Transactions

## 6. Security Principles

Security will be designed into the system from the beginning.

Principles include:

- Least privilege
- Defense in depth
- Secure authentication
- Strong authorization
- Input validation
- Secure session management
- Encryption
- Secrets management
- Audit logging
- Rate limiting
- Monitoring
- Secure dependency management

## 7. Data Protection

MaliOS will minimize collection and retention of personal and financial information.

Sensitive information should only be collected when necessary for a defined product function.

Secrets and credentials must never be stored in source code.

Environment variables and secure secrets management will be used for sensitive configuration.

## 8. External Financial Integrations

External financial providers will be integrated through controlled backend services.

The frontend will never directly communicate with financial institutions using secret credentials.

Architecture:

Frontend
↓
MaliOS API
↓
Integration Service
↓
External Financial Provider

## 9. Development Strategy

Development will occur incrementally.

Initial milestone:

Financial Dashboard

Future milestones:

- Accounts
- Transactions
- Budgets
- Goals
- Net Worth
- Investments
- Financial Health
- AI Financial Copilot
- Mobile Application
- Financial integrations

## 10. Technology Stack

Frontend:

React + Vite

Backend:

Node.js + Express

Database:

PostgreSQL

ORM:

Prisma

Mobile:

React Native + Expo

Version Control:

Git + GitHub
