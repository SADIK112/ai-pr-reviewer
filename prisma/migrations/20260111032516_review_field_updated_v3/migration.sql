-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_pullRequestId_fkey";

-- AlterTable
ALTER TABLE "PullRequest" ALTER COLUMN "prId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("prId") ON DELETE CASCADE ON UPDATE CASCADE;
