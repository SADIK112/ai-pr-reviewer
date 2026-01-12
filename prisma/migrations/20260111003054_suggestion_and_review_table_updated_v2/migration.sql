/*
  Warnings:

  - You are about to drop the column `comments` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `reviewer` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `filepath` on the `Suggestion` table. All the data in the column will be lost.
  - The `wasAccepted` column on the `Suggestion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `summary` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filePath` to the `Suggestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Suggestion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_pullRequestId_fkey";

-- DropForeignKey
ALTER TABLE "Suggestion" DROP CONSTRAINT "Suggestion_reviewId_fkey";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "comments",
DROP COLUMN "reviewer",
ADD COLUMN     "criticalIssues" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "summary" TEXT NOT NULL,
ALTER COLUMN "complexityScore" DROP NOT NULL,
ALTER COLUMN "complexityScore" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "totalSuggestions" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Suggestion" DROP COLUMN "filepath",
ADD COLUMN     "filePath" TEXT NOT NULL,
ADD COLUMN     "lineEnd" INTEGER,
ADD COLUMN     "suggestedCode" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "lineNumber" DROP NOT NULL,
DROP COLUMN "wasAccepted",
ADD COLUMN     "wasAccepted" BOOLEAN;

-- CreateIndex
CREATE INDEX "Review_pullRequestId_idx" ON "Review"("pullRequestId");

-- CreateIndex
CREATE INDEX "Suggestion_reviewId_idx" ON "Suggestion"("reviewId");

-- CreateIndex
CREATE INDEX "Suggestion_severity_idx" ON "Suggestion"("severity");

-- CreateIndex
CREATE INDEX "Suggestion_filePath_idx" ON "Suggestion"("filePath");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
