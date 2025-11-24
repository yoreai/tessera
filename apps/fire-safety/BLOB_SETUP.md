# Vercel Blob Setup for Fire Safety Data

## Step 1: Upload Data to Vercel Blob

From your terminal:

```bash
cd /Users/whitehat/dev/yev/aresa/notebooks/project_3_data_story_final/data

# Upload the corrected fire alarms data
vercel blob upload corrected_fire_alarms.csv --token YOUR_VERCEL_TOKEN
```

This will give you a blob URL like:
```
https://[hash].public.blob.vercel-storage.com/corrected_fire_alarms.csv
```

## Step 2: Set Environment Variable

In Vercel Dashboard:
1. Go to your fire-safety project settings
2. Environment Variables
3. Add: `BLOB_READ_WRITE_TOKEN` = (from Vercel Blob dashboard)

Or via CLI:
```bash
cd /Users/whitehat/dev/yev/aresa/apps/fire-safety
vercel env add BLOB_READ_WRITE_TOKEN production
# Paste your token when prompted
```

## Step 3: Update API Route

The API route is already set up at `app/api/data/route.ts`

Uncomment the Vercel Blob fetch code and it will:
- Fetch from blob storage
- Parse CSV
- Filter based on query params
- Return JSON to frontend

## Step 4: Frontend Will Auto-Update

The components are already designed to accept filtered data.
Once the API returns real data, charts will display actual records!

## Alternative: Lighter Approach

If 42MB CSV is too heavy to parse in serverless:

**Option A: Pre-process to JSON**
```bash
# Convert CSV to smaller JSON
python -c "
import pandas as pd
df = pd.read_csv('corrected_fire_alarms.csv')
# Select only needed columns
df_light = df[['call_year', 'fire_category', 'city_name', 'priority_desc']]
df_light.to_json('fire_data.json', orient='records')
"

# Upload JSON instead (will be ~20MB, faster to parse)
vercel blob upload fire_data.json
```

**Option B: Use Vercel Postgres** (Better for 930K records)
- Vercel partners with Neon
- Free tier: 512 MB storage
- Query with SQL (much faster than CSV parsing)
- Setup: https://vercel.com/docs/storage/vercel-postgres

## Recommended: Start with Blob, migrate to Postgres if needed

For 42MB data, Blob works fine. For full 930K records (173MB), Postgres is better.

