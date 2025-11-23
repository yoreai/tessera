# ARESA Monorepo - Next Steps

## ✅ What's Ready

**Structure Created:**
```
aresa/
├── apps/
│   ├── aresalab/          # Research showcase (Next.js)
│   └── fire-safety/       # Fire safety dashboard (Next.js)
├── publications/          # Source publications
├── docs/                  # (Will be replaced by aresalab)
└── huggingface_spaces/    # (Will be deprecated)
```

**AresaLab Foundation:**
- ✅ Next.js 14 with App Router
- ✅ Tailwind CSS
- ✅ TypeScript
- ✅ Basic landing page with 4 publication cards
- ✅ Copied from blaze_builder (PWA-ready structure)

**Fire Safety Foundation:**
- ✅ Scaffolded from aresalab
- ✅ Ready for dashboard implementation

---

## 🔨 To Complete

### 1. Install Dependencies & Test Locally

```bash
cd /Users/whitehat/dev/yev/aresa/apps/aresalab
npm install
npm run dev
# Visit http://localhost:3000
```

```bash
cd /Users/whitehat/dev/yev/aresa/apps/fire-safety
npm install
npm run dev
# Visit http://localhost:3000
```

### 2. Implement Fire Safety Dashboard

**Data Strategy:**
- Use Vercel Blob Storage for the 42MB CSV
- Upload via Vercel CLI: `vercel blob upload corrected_fire_alarms.csv`
- Query in app via `@vercel/blob`

**Components to Build:**
- Interactive Plotly charts (convert from Gradio)
- Municipality selector
- Temporal trend visualizations
- Policy recommendations section

**Reference:** `/Users/whitehat/dev/yev/aresa/notebooks/project_3_data_story_final/fire_safety_dashboard.py`

### 3. Deploy to Vercel

**AresaLab:**
```bash
cd apps/aresalab
vercel --prod
# Will be: aresalab.vercel.app
```

**Fire Safety:**
```bash
cd apps/fire-safety
vercel --prod
# Will be: fire-safety.vercel.app (or usfiresafety.vercel.app)
```

### 4. Migrate Content from docs/

**Move to AresaLab:**
- Publication detail pages (spotify.html → /publications/[slug]/page.tsx)
- PDF viewing (embed or link to GitHub)
- About section

### 5. Add Lead Generation to Fire Safety

**Commercial Features:**
- Contact form for building managers
- "Get AI-Approved Fire Alarms" CTA
- Email capture for outreach campaign
- Analytics tracking

---

## 📦 Data Migration Strategy

**For Fire Safety Dashboard:**

**Phase 1 (Now):**
- Upload CSV to Vercel Blob
- Query on-demand from blob storage
- ~$0.15/GB storage, $0.30/GB transfer (very cheap for 42MB)

**Phase 2 (When data grows):**
- Migrate to PostgreSQL on Vercel (Neon partnership)
- Or use Supabase Storage buckets (doesn't deactivate)

**Recommended:** Start with Vercel Blob - it's built-in, simple, and scales.

---

## 🎨 Design Improvements Needed

**AresaLab:**
- Add publication detail pages
- Implement PDF viewer or download
- Add research diagrams/architecture
- Video section (for future demos)

**Fire Safety:**
- Convert Gradio Plotly charts to react-plotly.js
- Add municipality search/filter
- Implement temporal controls
- Add lead generation form

---

## 🚀 Deployment Checklist

- [ ] Install dependencies in both apps
- [ ] Test locally (npm run dev)
- [ ] Connect Vercel CLI (`vercel login`)
- [ ] Upload fire safety data to Vercel Blob
- [ ] Deploy aresalab (`vercel --prod`)
- [ ] Deploy fire-safety (`vercel --prod`)
- [ ] Configure custom domains (optional)
- [ ] Enable GitHub Pages OR deprecate docs/ folder

---

**Status:** Foundation ready, needs implementation of dashboards and data integration.

**Estimated Completion:**
- Basic deployment: 2-3 hours
- Full feature parity with Gradio: 8-10 hours
- Commercial features (lead gen): 2-3 hours additional

