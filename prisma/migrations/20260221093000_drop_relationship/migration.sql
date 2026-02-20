-- Drop legacy relationship column from FamilyMember
ALTER TABLE "FamilyMember" DROP COLUMN IF EXISTS "relationship";
