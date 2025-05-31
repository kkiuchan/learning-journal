/*
  Warnings:

  - You are about to drop the column `isLifetimePro` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lifetimeProGrantedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lifetimeProGrantedBy` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isLifetimePro",
DROP COLUMN "lifetimeProGrantedAt",
DROP COLUMN "lifetimeProGrantedBy";
