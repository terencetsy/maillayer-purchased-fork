# Deployment Configuration Guide

## Required Environment Variables

### 1. Supabase Configuration

#### Required for All Environments
```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anonymous Key (Public - safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (Secret - server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Settings → API
4. Copy URL and both keys

---

### 2. Vercel KV (Redis) Configuration

#### Required for Queue System
```bash
# Vercel KV REST API URL
KV_REST_API_URL=https://your-kv-instance.kv.vercel-storage.com

# Vercel KV REST API Token
KV_REST_API_TOKEN=AXxxxxxxxxxxxxxxxxxxxxxxxxxx

# Vercel KV URL (for direct Redis connection)
KV_URL=redis://default:AXxxxxxxxxxxxxxxxxxxxxxxxxxx@your-kv-instance.kv.vercel-storage.com
```

**Where to find:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Storage → KV
3. Create new KV database (if not exists)
4. Click on database → `.env.local` tab
5. Copy all three variables

---

### 3. Application Configuration

#### Base URL
```bash
# Your application URL
BASE_URL=https://your-app.vercel.app
# For local: http://localhost:3000
```

#### Security Keys
```bash
# NextAuth Secret (generate random string)
NEXTAUTH_SECRET=your-random-secret-key-min-32-chars

# Tracking Secret (for email tracking)
TRACKING_SECRET=your-tracking-secret-key

# Encryption Key (for sensitive data)
ENCRYPTION_KEY=your-encryption-key-32-chars
```

**Generate secrets:**
```bash
# Generate random secret
openssl rand -base64 32
```

---

### 4. Email Provider Configuration

#### AWS SES (if using)
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

#### SendGrid (if using)
```bash
SENDGRID_API_KEY=SG....
```

#### Mailgun (if using)
```bash
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=mg.yourdomain.com
```

---

### 5. Storage Configuration

#### Digital Ocean Spaces / Cloudflare R2
```bash
# Storage provider (digitalocean or cloudflare)
STORAGE_PROVIDER=digitalocean

# Storage endpoint
STORAGE_ENDPOINT=https://nyc3.digitaloceanspaces.com
# For Cloudflare R2: https://your-account-id.r2.cloudflarestorage.com

# Storage credentials
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
STORAGE_BUCKET=your-bucket-name

# Public URL for uploaded files
STORAGE_PUBLIC_URL=https://your-bucket.nyc3.digitaloceanspaces.com
# For Cloudflare R2: https://your-public-domain.com
```

---

### 6. Optional Integrations

#### Firebase Admin (for Firebase sync)
```bash
# Firebase service account (JSON string)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

#### Google Sheets API
```bash
# Google service account (JSON string)
GOOGLE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

---

## Vercel Deployment Steps

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Link Project
```bash
cd /Users/terence/maillayer-supabase/maillayer-purchased-fork
vercel link
```

### 3. Add Environment Variables

**Option A: Via Vercel Dashboard**
1. Go to project settings
2. Environment Variables
3. Add each variable above

**Option B: Via CLI**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
vercel env add KV_URL
# ... add all others
```

### 4. Configure Cron Jobs

Create `vercel.json` in project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/email-sequences",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/sync-firebase",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/sync-supabase",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/sync-sheets",
      "schedule": "0 */12 * * *"
    },
    {
      "path": "/api/cron/sync-airtable",
      "schedule": "0 */12 * * *"
    }
  ]
}
```

**Cron Schedule Explanation:**
- `*/5 * * * *` - Every 5 minutes (email sequences)
- `0 */6 * * *` - Every 6 hours (Firebase/Supabase sync)
- `0 */12 * * *` - Every 12 hours (Sheets/Airtable sync)

### 5. Deploy
```bash
vercel --prod
```

---

## Local Development Setup

### 1. Create `.env.local`
```bash
# Copy all environment variables to .env.local
cp .env.example .env.local
```

### 2. Fill in values
Edit `.env.local` with your actual credentials

### 3. Run development server
```bash
npm run dev
```

---

## Environment Variable Checklist

### Critical (Required)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `KV_REST_API_URL`
- [ ] `KV_REST_API_TOKEN`
- [ ] `KV_URL`
- [ ] `BASE_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `ENCRYPTION_KEY`

### Important (Recommended)
- [ ] `TRACKING_SECRET`
- [ ] Email provider credentials (AWS/SendGrid/Mailgun)
- [ ] Storage credentials (DO Spaces/Cloudflare R2)

### Optional (Feature-specific)
- [ ] `FIREBASE_SERVICE_ACCOUNT` (if using Firebase sync)
- [ ] `GOOGLE_SERVICE_ACCOUNT` (if using Google Sheets sync)

---

## Security Best Practices

1. **Never commit `.env.local`** to git (already in `.gitignore`)
2. **Use different keys** for development and production
3. **Rotate secrets** periodically
4. **Restrict Supabase RLS policies** appropriately
5. **Enable Vercel Authentication** for cron endpoints (optional)

---

## Quick Start Template

Create `.env.local` with this template:

```bash
# === CRITICAL - REQUIRED ===
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_URL=
BASE_URL=http://localhost:3000
NEXTAUTH_SECRET=
ENCRYPTION_KEY=

# === IMPORTANT - RECOMMENDED ===
TRACKING_SECRET=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
STORAGE_PROVIDER=digitalocean
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
STORAGE_PUBLIC_URL=

# === OPTIONAL - INTEGRATIONS ===
FIREBASE_SERVICE_ACCOUNT=
GOOGLE_SERVICE_ACCOUNT=
```
