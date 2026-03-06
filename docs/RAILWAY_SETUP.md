# Railway Setup Instructions for North Star Postal

## Step 1: Railway Project Configuration

### Current Status
You have created a Railway project called "pretty-purpose". Now follow these steps to complete the setup:

### 1.1 Add PostgreSQL Service

In your Railway dashboard:
1. Click on your "pretty-purpose" project
2. Click "+ New" → "Database" → "Add PostgreSQL"
3. Railway will automatically create a PostgreSQL instance
4. The service should be named `northstar-db` (you can rename it in settings)
5. Railway will automatically inject the `DATABASE_URL` environment variable

### 1.2 Add Gotenberg Service

In your Railway dashboard:
1. Click "+ New" → "Docker Image"
2. Image name: `gotenberg/gotenberg:8`
3. Name the service: `northstar-gotenberg`
4. In the service settings, add these environment variables:
   ```
   PORT=3000
   ```
5. Under "Networking", ensure internal networking is enabled
6. The internal URL will be: `http://northstar-gotenberg.railway.internal:3000`

### 1.3 Add the Main Application Service

1. Click "+ New" → "GitHub Repo" (or "Empty Service" if not using GitHub)
2. Name it: `northstar-app`
3. If using GitHub:
   - Connect your GitHub account
   - Select your repository
   - Railway will auto-deploy on push
4. If not using GitHub:
   - Use Railway CLI to push code:
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   railway up
   ```

### 1.4 Configure Environment Variables

In the `northstar-app` service settings, add these environment variables:

```bash
# Internal Railway service URL (automatic reference)
GOTENBERG_URL=${{northstar-gotenberg.RAILWAY_INTERNAL_URL}}

# AWS (you'll need to provide these)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your_value>
AWS_SECRET_ACCESS_KEY=<your_value>
AWS_S3_BUCKET=northstar-postal

# OpenAI
OPENAI_API_KEY=<your_value>

# PostGrid (can be added later)
POSTGRID_API_KEY=<your_value>

# Application
NEXT_PUBLIC_BASE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
ADMIN_SESSION_SECRET=<generate_32_char_random_string>

# Database URL (automatic reference)
DATABASE_URL=${{northstar-db.DATABASE_URL}}
```

### 1.5 Configure Service Settings

For the `northstar-app` service:
1. Go to Settings → Deploy
2. Set Start Command: `npm run start`
3. Set Build Command: `npm run build`
4. Set Health Check Path: `/api/health` (we'll create this endpoint)
5. Ensure "Private Networking" is enabled

### 1.6 Domain Configuration

1. In `northstar-app` service settings → Networking
2. Click "Generate Domain" to get a `*.up.railway.app` domain
3. Or add a custom domain if you have one

## Verification Checklist

- [ ] PostgreSQL service (`northstar-db`) is running
- [ ] Gotenberg service (`northstar-gotenberg`) is running
- [ ] Main app service (`northstar-app`) is created
- [ ] Environment variables are configured
- [ ] Internal networking is enabled between services
- [ ] Public domain is assigned to `northstar-app`

## Important Notes

1. **Gotenberg Internal URL**: The Gotenberg service should ONLY be accessible internally via `http://northstar-gotenberg.railway.internal:3000`. It should NOT have a public URL.

2. **Database Connection**: Railway automatically injects the `DATABASE_URL` for PostgreSQL. Don't hardcode it.

3. **Service Names**: The service names (`northstar-app`, `northstar-db`, `northstar-gotenberg`) are important for internal networking references.

4. **Deployment**: Railway will auto-deploy when you push to your connected GitHub repo, or you can use `railway up` with the CLI.

## Next Steps

Once all services are configured in Railway:
1. Install dependencies locally: `npm install`
2. Push your code to trigger deployment
3. Check Railway logs to ensure services start correctly
4. Proceed to Step 2 (Prisma Schema) in the build plan