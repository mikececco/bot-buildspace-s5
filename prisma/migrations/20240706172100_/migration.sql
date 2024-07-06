/*
  Warnings:

  - You are about to drop the column `folder` on the `bookmarks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookmarks" DROP COLUMN "folder",
ADD COLUMN     "folderId" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "folders" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Favourites',
    "userId" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
