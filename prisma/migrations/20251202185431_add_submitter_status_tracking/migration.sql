-- CreateTable
CREATE TABLE "SubmitterStatus" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "docusealSubmitterId" INTEGER,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmitterStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubmitterStatus_submissionId_idx" ON "SubmitterStatus"("submissionId");

-- CreateIndex
CREATE INDEX "SubmitterStatus_docusealSubmitterId_idx" ON "SubmitterStatus"("docusealSubmitterId");

-- CreateIndex
CREATE INDEX "SubmitterStatus_email_idx" ON "SubmitterStatus"("email");

-- AddForeignKey
ALTER TABLE "SubmitterStatus" ADD CONSTRAINT "SubmitterStatus_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
