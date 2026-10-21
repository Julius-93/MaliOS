-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('WATCHING', 'INTERESTED', 'PASSED');

-- CreateTable
CREATE TABLE "InvestmentOpportunity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "assetType" "AssetType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "minimumInvestment" DECIMAL(19,4) NOT NULL,
    "expectedReturn" DECIMAL(8,4),
    "riskLevel" "RiskLevel" NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'WATCHING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvestmentOpportunity_userId_idx" ON "InvestmentOpportunity"("userId");

-- AddForeignKey
ALTER TABLE "InvestmentOpportunity" ADD CONSTRAINT "InvestmentOpportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
