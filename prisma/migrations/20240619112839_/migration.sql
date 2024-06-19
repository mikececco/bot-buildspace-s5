/*
  Warnings:

  - Added the required column `content` to the `embeddings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "embeddings" ADD COLUMN     "content" TEXT NOT NULL;
