/*
  Warnings:

  - You are about to drop the column `summary_id` on the `thoughts` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `summaries` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "thoughts" DROP CONSTRAINT "thoughts_summary_id_fkey";

-- AlterTable
ALTER TABLE "summaries" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "thoughts" DROP COLUMN "summary_id";

-- CreateTable
CREATE TABLE "ThoughtSummary" (
    "thoughtId" INTEGER NOT NULL,
    "summaryId" INTEGER NOT NULL,

    CONSTRAINT "ThoughtSummary_pkey" PRIMARY KEY ("thoughtId","summaryId")
);

-- AddForeignKey
ALTER TABLE "ThoughtSummary" ADD CONSTRAINT "ThoughtSummary_thoughtId_fkey" FOREIGN KEY ("thoughtId") REFERENCES "thoughts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThoughtSummary" ADD CONSTRAINT "ThoughtSummary_summaryId_fkey" FOREIGN KEY ("summaryId") REFERENCES "summaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
