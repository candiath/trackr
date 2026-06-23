-- CreateEnum
CREATE TYPE "EventKind" AS ENUM ('RELAPSE', 'URGE');

-- AlterTable
ALTER TABLE "RelapseEvent" ADD COLUMN     "kind" "EventKind" NOT NULL DEFAULT 'RELAPSE';
