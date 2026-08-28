# MBBS Medical Animation - Deploy Guide

## Run on your phone in 2 minutes (Free)

### Option 1: Replit (Easiest - no PC needed)
1. Go to **replit.com** on your phone
2. Sign up (free)
3. Click **+ Create Repl**
4. Choose **Node.js** template
5. Upload all files from this folder
6. Click **Run**
7. Your app is live at `https://your-app-name.repl.co`

### Option 2: Glitch (Free)
1. Go to **glitch.com** on your phone
2. Sign up (free)
3. Click **New Project** → **Import from GitHub**
4. Or upload files manually
5. App runs automatically

### Option 3: GitHub Pages (Free, needs GitHub account)
1. Create GitHub repo
2. Upload all files
3. Go to Settings → Pages → Deploy from main branch
4. Your app: `https://yourusername.github.io/repo-name/`

### Option 4: Run on your computer
```bash
# Install Node.js first (free)
# Then:
cd mbbs-medical-web
npm install
npm start
# Open http://localhost:3000
```

## What it does

1. You type a medical topic (e.g. "Pathogenesis of tuberculosis")
2. **AI searches 7 free databases simultaneously:**
   - PubMed (medical papers)
   - OpenAlex (academic research)
   - CrossRef (citations)
   - Semantic Scholar (AI-powered)
   - Wikipedia (encyclopedia)
   - Google Scholar (papers)
   - DuckDuckGo (instant answers)
3. Shows all sources found
4. Plays 3D animation with voice narration
5. Quiz tests your knowledge

## Tech Stack
- **Backend**: Node.js + Express
- **Frontend**: HTML + CSS + Three.js (3D)
- **Voice**: Web Speech API (free, built into browser)
- **Hosting**: Any free platform
- **Cost**: $0
