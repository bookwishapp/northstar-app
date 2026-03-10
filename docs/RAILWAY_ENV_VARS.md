# Railway Environment Variables

This document lists all environment variables that need to be configured in Railway for the North Star Postal application.

## Required Environment Variables

These variables MUST be set in Railway or the application will fail:

### Database
- `DATABASE_URL` - PostgreSQL connection string (Railway auto-injects this from the Postgres service)

### AWS Services
- `AWS_ACCESS_KEY_ID` - AWS IAM access key ID for S3 and SES
- `AWS_SECRET_ACCESS_KEY` - AWS IAM secret access key for S3 and SES
- `AWS_REGION` - AWS region (e.g., `us-east-1`)
- `AWS_S3_BUCKET` - S3 bucket name for storing generated PDFs and assets

### Email (AWS SES)
- `FROM_EMAIL` - Verified email address in AWS SES for sending emails

### AI Services
- `OPENAI_API_KEY` - OpenAI API key for GPT-4o content generation

### PDF Generation
- `GOTENBERG_URL` - Internal Railway URL for Gotenberg service (e.g., `http://northstar-gotenberg.railway.internal:3000`)

### Authentication
- `AUTH_SECRET` - Random secret for NextAuth session encryption (generate with `openssl rand -base64 32`)

### Application
- `NEXT_PUBLIC_BASE_URL` - Public URL of your application (e.g., `https://www.northstarpostal.com`)

## Optional Environment Variables

These variables can be set for additional features:

### Physical Mail Delivery
- `POSTGRID_API_KEY` - PostGrid API key (only required for physical mail delivery)

### Email Settings
- `FROM_NAME` - Display name for emails (defaults to "North Star Postal")

### Domain Redirects
- `PRIMARY_DOMAIN` - Primary domain for www/non-www redirects (e.g., `www.northstarpostal.com`)

### Railway System Variables (Auto-Set)
- `RAILWAY_ENVIRONMENT` - Set automatically by Railway (production/development)
- `NODE_ENV` - Set automatically by Railway

## Setting Environment Variables in Railway

1. Go to your Railway project
2. Select the service (e.g., `northstar-app`)
3. Click on "Variables" tab
4. Add each required variable with its value
5. Railway will automatically restart the service when variables are updated

## Important Notes

- **AWS Credentials**: The AWS IAM user must have permissions for:
  - S3: PutObject, GetObject on the specified bucket
  - SES: SendEmail, SendRawEmail

- **AWS SES**: The FROM_EMAIL must be verified in AWS SES. In sandbox mode, recipient emails must also be verified.

- **Gotenberg URL**: Use the internal Railway service URL format: `http://<service-name>.railway.internal:<port>`

- **No Hardcoded Values**: The application will fail if required variables are missing. There are no hardcoded fallback values in production.

## Environment Variable Validation

The application validates required environment variables at startup. If any required variables are missing, you'll see error messages like:

- "AWS credentials not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION in Railway."
- "AWS_S3_BUCKET not configured. Please set AWS_S3_BUCKET in Railway."
- "FROM_EMAIL not configured. Please set FROM_EMAIL in Railway."
- "GOTENBERG_URL not configured. Please set GOTENBERG_URL in Railway."

## Security Notes

- Never commit environment variables to version control
- Use Railway's built-in secrets management
- Rotate API keys and secrets regularly
- Use separate AWS IAM users with minimal required permissions