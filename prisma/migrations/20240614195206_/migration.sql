/*
  Warnings:

  - Added the required column `summary_id` to the `thoughts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "thoughts" ADD COLUMN     "summary_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "summaries" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "summaries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "thoughts" ADD CONSTRAINT "thoughts_summary_id_fkey" FOREIGN KEY ("summary_id") REFERENCES "summaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
