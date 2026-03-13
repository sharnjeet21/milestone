# Quick Start Guide - MilestoneAI Demo

Get the project running in 5 minutes with sample data!

## Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API Key (optional - works in mock mode without it)

## Step 1: Backend Setup (2 minutes)

```bash
cd backend
source venv/bin/activate  # or: source ../venv/bin/activate
pip install -r requirements.txt
```

Your `.env` file is already configured. Just add your OpenAI key if you have one:
```env
OPENAI_API_KEY=your_key_here
```

## Step 2: Frontend Setup (1 minute)

```bash
cd frontend
npm install
```

## Step 3: Run the Project (1 minute)

**Terminal 1 - Backend:**
```bash
./start-backend.sh
```

**Terminal 2 - Frontend:**
```bash
./start-frontend.sh
```

## Step 4: Explore the Demo

Visit http://localhost:3000

### Sample Data Included:

1. **E-commerce Website Project**
   - Budget: $5,000
   - 3 milestones
   - Freelancer PFI: 750 (Excellent)
   - Status: 1 milestone completed

2. **Mobile App UI/UX Design**
   - Budget: $3,000
   - 3 milestones
   - Freelancer PFI: 650 (Good)
   - Status: All pending

### Demo Features:

- **View Projects**: Go to `/employer` to see all projects
- **Create New Project**: Click "Post Project" (uses AI if OpenAI key is set)
- **Payment Flow Demo**: Go to `/payment` to see the complete escrow payment process:
  - Submit milestone work
  - AI quality evaluation
  - Automatic payment release
  - PFI score updates
- **Smart Escrow**: Go to `/escrow` for vault status and risk assessment
- **Freelancer Portal**: Go to `/freelancer` to see freelancer view

### Test the Payment Flow:

1. Go to http://localhost:3000/payment
2. Use these test values:
   - Project ID: `demo-project-1`
   - Milestone ID: `m2`
   - Freelancer ID: `demo-freelancer-1`
   - Submitted Work: "Completed all frontend components with responsive design"
   - Days Taken: `15`
   - Revisions: `0`
3. Click "Submit & Process Payment"
4. Watch the AI evaluate the work and release payment automatically!

### Test IDs for Demo:

- **Projects**: `demo-project-1`, `demo-project-2`
- **Freelancers**: `demo-freelancer-1`, `demo-freelancer-2`
- **Employers**: `demo-employer-1`, `demo-employer-2`

## Without Firebase (Default)

The project works perfectly without Firebase setup:
- Uses in-memory storage
- Sample data loads automatically
- All features work except authentication

## With Firebase (Optional)

To enable authentication and persistent storage:
1. Follow `FIREBASE_SETUP.md`
2. Add Firebase credentials to `.env.local`
3. Download service account JSON
4. Restart servers

## Troubleshooting

**Port already in use:**
```bash
lsof -i :9001  # Find process
kill -9 <PID>  # Kill it
```

**Module not found:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend won't start:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## API Documentation

Once running, visit:
- API Docs: http://localhost:9001/docs
- Interactive API: http://localhost:9001/redoc

## Next Steps

1. Try creating a new project with AI decomposition
2. Test the smart escrow risk assessment
3. Submit milestone work and see quality scoring
4. Check PFI score updates
5. Set up Firebase for full authentication

Enjoy exploring MilestoneAI! 🚀
