/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `folders` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "embeddings" DROP CONSTRAINT "embeddings_bookmarkId_fkey";

-- DropForeignKey
ALTER TABLE "embeddings" DROP CONSTRAINT "embeddings_thoughtId_fkey";

-- DropForeignKey
ALTER TABLE "embeddings" DROP CONSTRAINT "embeddings_userId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "folders_name_key" ON "folders"("name");

-- AddForeignKey
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_thoughtId_fkey" FOREIGN KEY ("thoughtId") REFERENCES "thoughts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_bookmarkId_fkey" FOREIGN KEY ("bookmarkId") REFERENCES "bookmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
