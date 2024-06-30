/*
  Warnings:

  - A unique constraint covering the columns `[userId,link]` on the table `bookmarks` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "bookmarks_link_key";

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_link_key" ON "bookmarks"("userId", "link");
