-- Reset migration history (run this in Railway SQL console if needed)
-- WARNING: This will clear migration tracking but not affect actual schema

-- Check if _prisma_migrations table exists and clear it
DELETE FROM "_prisma_migrations" WHERE 1=1;

-- Or if you need to be more careful, just mark old ones as rolled back:
-- UPDATE "_prisma_migrations" SET rolled_back_at = NOW() WHERE migration_name != '20260311000000_critical_gap_fixes';