# Claude Development Notes

## Railway Database Migration Process

Railway does not provide:
- SQL console access
- Database GUI tools
- Command-line access to run migrations
- Any way to execute database migrations directly

### The Problem
- Database is NOT accessible during build phase (only at runtime)
- Cannot run `prisma migrate deploy` during build
- Cannot run migrations automatically on startup
- Must use a temporary endpoint approach

### Migration Process for Railway

#### 1. Create Migration Endpoint
Create temporary file: `app/api/migrate/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'run-migration-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      output: stdout,
      error: stderr || null
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      message: error.message
    }, { status: 500 });
  }
}
```

#### 2. Configure package.json
```json
{
  "scripts": {
    "build": "prisma generate && next build",  // NO migration here
    "start": "next start"  // NO migration here either
  }
}
```

#### 3. Deploy Process
1. Push code with migration endpoint
2. Railway builds and deploys the app
3. Once deployed, visit: `https://[app-name]-production-[id].up.railway.app/api/migrate?secret=run-migration-2024`
   - Example: `https://northstar-app-production-5347.up.railway.app/api/migrate?secret=run-migration-2024`
   - Note: Railway URLs include a numeric ID after "production"
4. Check response for success
5. Remove migration endpoint and redeploy

#### 4. Cleanup
After migration succeeds:
1. Delete `app/api/migrate/route.ts`
2. Commit and push
3. Redeploy to remove the endpoint

### Common Mistakes to Avoid
❌ DON'T put migration in build script - database not available
❌ DON'T put migration in start script - will fail every restart
❌ DON'T try to use DATABASE_URL during build - connection will fail
❌ DON'T forget to remove the migration endpoint after use

### Why This Is Necessary
Railway's architecture:
- Build phase: Runs in isolated container without database access
- Runtime phase: Has database access but no manual execution capability
- No SQL console: Cannot run migrations manually through UI
- Security: Database only accessible from within the Railway network

### Alternative (if available)
If Railway ever adds:
- SQL console in dashboard
- CLI tool for database access
- Migration running capability

Then use those instead of the endpoint approach.

## Key Learnings
1. Railway database is ONLY accessible at runtime, not build time
2. Must use temporary endpoints for one-time database operations
3. Always remove sensitive endpoints after use
4. Document the migration in git commits for tracking

## Development Rules
1. **NO TODOs ALLOWED** - All features must be fully implemented, not stubbed
2. Code must be production-ready, not placeholders
3. Complete the entire feature before moving on
4. No console.log() placeholders - implement actual functionality

## Template for Future Migrations
When adding new migrations:
1. Create migration locally: `npx prisma migrate dev --name your_migration_name`
2. Test locally
3. Add migration endpoint (copy from above)
4. Deploy
5. Run migration via endpoint
6. Remove endpoint
7. Redeploy

---
Last updated: 2024-03-13
Remember: This process is required for EVERY schema change on Railway!