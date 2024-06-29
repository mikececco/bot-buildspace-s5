/*
  Warnings:

  - You are about to drop the column `list` on the `bookmarks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookmarks" DROP COLUMN "list",
ADD COLUMN     "content" TEXT NOT NULL DEFAULT 'default content';
