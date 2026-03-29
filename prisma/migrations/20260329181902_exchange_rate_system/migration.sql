/*
  Warnings:

  - You are about to drop the column `exchangeRate` on the `Investment` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExchangeRate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Investment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "costBasis" REAL NOT NULL DEFAULT 0,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "units" REAL NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Investment" ("costBasis", "createdAt", "currency", "currentValue", "id", "name", "note", "type", "units", "updatedAt", "userId") SELECT "costBasis", "createdAt", "currency", "currentValue", "id", "name", "note", "type", "units", "updatedAt", "userId" FROM "Investment";
DROP TABLE "Investment";
ALTER TABLE "new_Investment" RENAME TO "Investment";
CREATE TABLE "new_InvestmentTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "units" REAL NOT NULL DEFAULT 0,
    "pricePerUnit" REAL NOT NULL DEFAULT 0,
    "exchangeRate" REAL NOT NULL DEFAULT 1,
    "note" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvestmentTransaction_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InvestmentTransaction" ("amount", "createdAt", "date", "id", "investmentId", "note", "pricePerUnit", "type", "units") SELECT "amount", "createdAt", "date", "id", "investmentId", "note", "pricePerUnit", "type", "units" FROM "InvestmentTransaction";
DROP TABLE "InvestmentTransaction";
ALTER TABLE "new_InvestmentTransaction" RENAME TO "InvestmentTransaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_userId_currency_key" ON "ExchangeRate"("userId", "currency");
