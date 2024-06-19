/*
  Warnings:

  - You are about to drop the column `embedding` on the `thoughts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "thoughts" DROP COLUMN "embedding";

-- CreateTable
CREATE TABLE "embeddings" (
    "id" SERIAL NOT NULL,
    "embedding" vector,
    "thoughtId" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_thoughtId_fkey" FOREIGN KEY ("thoughtId") REFERENCES "thoughts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
