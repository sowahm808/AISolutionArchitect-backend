-- Add project intake fields submitted by the frontend project creation form.
ALTER TABLE "Project" ADD COLUMN "company" TEXT;
ALTER TABLE "Project" ADD COLUMN "industry" TEXT;
ALTER TABLE "Project" ADD COLUMN "businessProblem" TEXT;
ALTER TABLE "Project" ADD COLUMN "currentArchitecture" TEXT;
ALTER TABLE "Project" ADD COLUMN "targetGoal" TEXT;
ALTER TABLE "Project" ADD COLUMN "compliance" TEXT;
ALTER TABLE "Project" ADD COLUMN "budget" TEXT;
ALTER TABLE "Project" ADD COLUMN "timeline" TEXT;
ALTER TABLE "Project" ADD COLUMN "notes" TEXT;
