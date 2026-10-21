-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "DateFormatPreference" AS ENUM ('DD_MM_YYYY', 'MM_DD_YYYY', 'YYYY_MM_DD');

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" "ThemePreference" NOT NULL DEFAULT 'SYSTEM',
    "compactMode" BOOLEAN NOT NULL DEFAULT false,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'KES',
    "defaultAccountId" TEXT,
    "dateFormat" "DateFormatPreference" NOT NULL DEFAULT 'DD_MM_YYYY',
    "hideBalances" BOOLEAN NOT NULL DEFAULT false,
    "budgetNotifications" BOOLEAN NOT NULL DEFAULT true,
    "goalNotifications" BOOLEAN NOT NULL DEFAULT true,
    "investmentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "largeTransactionAlerts" BOOLEAN NOT NULL DEFAULT true,
    "lowBalanceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "budgetAlertThreshold" INTEGER NOT NULL DEFAULT 80,
    "largeTransactionThreshold" DECIMAL(19,4) NOT NULL DEFAULT 50000,
    "lowBalanceThreshold" DECIMAL(19,4) NOT NULL DEFAULT 10000,
    "autoLogoutMinutes" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
