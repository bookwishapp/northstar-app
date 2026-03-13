# Production Migration Plan

## What Changed
- Added `Holiday` model to database schema
- Added `holidayId` field to `Program` model
- Added `holidayId` field to `Template` model
- Added relations between Holiday, Program, and Template models
- Added `description` and `features` fields to Program model

## Migration Steps for Railway Production

### Step 1: Generate Migration File
```bash
npx prisma migrate dev --name add-holiday-model --create-only
```

### Step 2: Deploy to Railway
```bash
git add .
git commit -m "Add Holiday model and update frontend"
git push
```

### Step 3: Run Migration on Railway
Use the Railway dashboard or CLI:
```bash
railway run npx prisma migrate deploy
```

### Step 4: Seed Holiday Data (Optional)
Create holidays in the database via Prisma Studio or a seed script:
```javascript
// Example seed data
await prisma.holiday.createMany({
  data: [
    { slug: 'easter', name: 'Easter', description: '...', isActive: true },
    { slug: 'christmas', name: 'Christmas', description: '...', isActive: true },
    { slug: 'birthday', name: 'Birthday', description: '...', isActive: true },
    { slug: 'halloween', name: 'Halloween', description: '...', isActive: true },
    { slug: 'tooth-fairy', name: 'Tooth Fairy', description: '...', isActive: true },
    { slug: 'valentine', name: "Valentine's Day", description: '...', isActive: true }
  ]
});
```

## The Site IS Production-Ready

The site is built for production deployment - I'm just testing it locally first to ensure everything works. It will run on Railway just like the backend already does.

## Frontend is Using Real Images Now
- Easter images copied from your folder
- Ready for other holidays when you provide them
- No placeholders in production

## Note on Admin Upload
The existing admin panel at `/admin/templates` already has image upload functionality for template assets (headers, backgrounds, signatures, wax seals). These upload to S3.