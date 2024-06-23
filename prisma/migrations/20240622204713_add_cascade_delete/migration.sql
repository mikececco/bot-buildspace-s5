-- DropForeignKey
ALTER TABLE "thoughts" DROP CONSTRAINT "thoughts_userId_fkey";

-- AddForeignKey
ALTER TABLE "thoughts" ADD CONSTRAINT "thoughts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
