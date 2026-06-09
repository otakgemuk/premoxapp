# MoxApp Sanity Studio — Setup Guide

## 1. Create a Sanity Project

```bash
# Install Sanity CLI
npm install -g sanity

# Login
sanity login

# Create project (use existing if you have one)
sanity projects create --display-name "MoxApp Studio"
# Note the Project ID shown after creation
```

## 2. Configure Environment

Create `studio/.env`:
```
SANITY_STUDIO_PROJECT_ID=your_project_id_here
SANITY_STUDIO_DATASET=production
```

## 3. Install & Run Studio Locally

```bash
cd studio
npm install
npm run dev
# Studio opens at http://localhost:3333
```

## 4. Import All Data (225 plans, 21 firms)

```bash
# From the studio/ directory
sanity dataset import scripts/seed-data.ndjson production --replace
```

## 5. Deploy Studio (Public URL for your editor)

```bash
cd studio
npm run deploy
# Studio will be live at https://moxapp.sanity.studio
```

## 6. Connect Frontend

Add to `frontend/.env`:
```
VITE_SANITY_PROJECT_ID=your_project_id_here
VITE_SANITY_DATASET=production
```

---

## For Your Content Editor (Non-Technical)

Send them the studio URL (e.g. `https://moxapp.sanity.studio`) and invite them via:

```bash
sanity users invite editor@example.com
```

### What they can update:
- **Prop Firms** → website URL, affiliate code, trustpilot score, active/inactive
- **Plans by Firm** → all pricing fields, discounts, rules
- Grouped view makes it easy: click a firm → see all their plans

### What auto-calculates:
They just enter `Eval Fee`, `Activation Fee`, `Discount %` — the `Total Cost to Funded` field needs to be manually entered per the calculation rules (or you can add a custom input component later to auto-calculate it).
