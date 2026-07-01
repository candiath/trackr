-- Drop the soft-delete tombstones. They only existed to propagate deletions to the
-- offline client during sync; the sync layer is gone and the app hard-deletes now.
ALTER TABLE "Relapse" DROP COLUMN "deletedAt";
ALTER TABLE "RelapseEvent" DROP COLUMN "deletedAt";
ALTER TABLE "Trigger" DROP COLUMN "deletedAt";
ALTER TABLE "MoodEntry" DROP COLUMN "deletedAt";
ALTER TABLE "MoodFactor" DROP COLUMN "deletedAt";
