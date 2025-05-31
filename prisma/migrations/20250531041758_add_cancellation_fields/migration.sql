/*
  Warnings:

  - You are about to drop the `PaymentHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubscriptionPlan` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
ADD COLUMN     "canceledAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "PaymentHistory";

-- DropTable
DROP TABLE "Subscription";

-- DropTable
DROP TABLE "SubscriptionPlan";
