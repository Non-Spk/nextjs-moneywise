-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "groupId" TEXT;

-- CreateTable
CREATE TABLE "Lending" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "borrower" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL,
    "isReturned" BOOLEAN NOT NULL DEFAULT false,
    "returnedAt" DATETIME,
    "returnedAmount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lending_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
