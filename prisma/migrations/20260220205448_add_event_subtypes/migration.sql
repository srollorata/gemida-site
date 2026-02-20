-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'MEMORIAL';
ALTER TYPE "EventType" ADD VALUE 'REUNION';
ALTER TYPE "EventType" ADD VALUE 'BIRTHDAY';
ALTER TYPE "EventType" ADD VALUE 'WEDDING';
ALTER TYPE "EventType" ADD VALUE 'GRADUATION';
ALTER TYPE "EventType" ADD VALUE 'ACHIEVEMENT';
