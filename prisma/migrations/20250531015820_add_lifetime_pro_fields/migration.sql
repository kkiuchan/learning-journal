-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isLifetimePro" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lifetimeProGrantedAt" TIMESTAMP(3),
ADD COLUMN     "lifetimeProGrantedBy" TEXT;
