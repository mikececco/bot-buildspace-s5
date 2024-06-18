/*
  Warnings:

  - You are about to drop the `ThoughtSummary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `summaries` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ThoughtSummary" DROP CONSTRAINT "ThoughtSummary_summaryId_fkey";

-- DropForeignKey
ALTER TABLE "ThoughtSummary" DROP CONSTRAINT "ThoughtSummary_thoughtId_fkey";

-- DropForeignKey
ALTER TABLE "summaries" DROP CONSTRAINT "summaries_userId_fkey";

-- DropTable
DROP TABLE "ThoughtSummary";

-- DropTable
DROP TABLE "summaries";
