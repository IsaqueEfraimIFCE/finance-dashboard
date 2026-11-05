/*
  Warnings:

  - You are about to drop the column `plaidAccountId` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `accessToken` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `cursor` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `plaidItemId` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `plaidTransactionId` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `pluggyAccountId` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pluggyItemId` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pluggyTransactionId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "pluggyAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialName" TEXT,
    "mask" TEXT,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "currentBalance" REAL,
    "availableBalance" REAL,
    "isoCurrencyCode" TEXT DEFAULT 'BRL',
    CONSTRAINT "Account_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("availableBalance", "currentBalance", "id", "isoCurrencyCode", "itemId", "mask", "name", "officialName", "subtype", "type") SELECT "availableBalance", "currentBalance", "id", "isoCurrencyCode", "itemId", "mask", "name", "officialName", "subtype", "type" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_pluggyAccountId_key" ON "Account"("pluggyAccountId");
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pluggyItemId" TEXT NOT NULL,
    "institutionName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("createdAt", "id", "institutionName", "status", "updatedAt", "userId") SELECT "createdAt", "id", "institutionName", "status", "updatedAt", "userId" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE UNIQUE INDEX "Item_pluggyItemId_key" ON "Item"("pluggyItemId");
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "pluggyTransactionId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "isoCurrencyCode" TEXT DEFAULT 'BRL',
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "merchantName" TEXT,
    "category" TEXT,
    "pending" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountId", "amount", "category", "createdAt", "date", "id", "isoCurrencyCode", "merchantName", "name", "pending") SELECT "accountId", "amount", "category", "createdAt", "date", "id", "isoCurrencyCode", "merchantName", "name", "pending" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_pluggyTransactionId_key" ON "Transaction"("pluggyTransactionId");
CREATE INDEX "Transaction_accountId_date_idx" ON "Transaction"("accountId", "date");
CREATE INDEX "Transaction_merchantName_idx" ON "Transaction"("merchantName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
