# MilestoneAI - Autonomous Project Decomposition & Payment Agent

AI-powered platform that automatically breaks down projects into milestones, evaluates work quality, and manages escrow payments with Firebase authentication and database.

## Features

- 🤖 AI-powered project decomposition into milestones
- ✅ Automated quality evaluation with scoring
- 💰 Smart escrow payment system with risk assessment
- 📊 Professional Fidelity Index (PFI) scoring for freelancers
- 🔄 Automated payment releases based on completion
- 🔐 Firebase Authentication (Email, Google, GitHub)
- 🗄️ Firestore Database for persistent storage
- 🛡️ AI-powered fraud detection and risk assessment

## Tech Stack

- Backend: FastAPI + LangChain + OpenAI + Firebase Admin
- Frontend: Next.js 14 + TypeScript + Tailwind CSS + Firebase SDK
- Database: Firebase Firestore
- Authentication: Firebase Auth

## Quick Start

**Want to try it immediately?** See [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup with sample data!

### Prerequisites

- Python 3.11+
- Node.js 18+
- Firebase project (see FIREBASE_SETUP.md)

### 1. Clone and Setup

```bash
git clone <your-repo>
cd cogni
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_key
DATABASE_URL=sqlite:///./milestoneai.db
FIREBASE_SERVICE_ACCOUNT_PATH=../firebase-service-account.json
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:9001/api
```

### 4. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password, Google, GitHub)
3. Create Firestore Database
4. Download service account JSON and save as `firebase-service-account.json` in root
5. See `FIREBASE_SETUP.md` for detailed instructions

### 5. Run the Project

**Option 1: Using startup scripts**
```bash
# Terminal 1 - Backend
./start-backend.sh

# Terminal 2 - Frontend
./start-frontend.sh
```

**Option 2: Manual**
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:9001
- API Docs: http://localhost:9001/docs

## Project Structure

```
cogni/
├── backend/
│   ├── agents/           # AI agents (NLP, Quality, Payment, PFI, Escrow)
│   ├── database/         # Firebase integration
│   ├── middleware/       # Auth middleware
│   ├── models/          # Data models
│   ├── main.py          # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── app/             # Next.js pages
│   │   ├── login/       # Login page
│   │   ├── signup/      # Signup page
│   │   ├── employer/    # Employer dashboard
│   │   ├── freelancer/  # Freelancer portal
│   │   └── escrow/      # Smart escrow vault
│   └── lib/             # Firebase, Auth, API utilities
├── firebase-service-account.json  # Firebase credentials (gitignored)
└── FIREBASE_SETUP.md    # Detailed Firebase setup guide
```

## Key Features

### AI Decomposition
Automatically breaks projects into logical, measurable milestones with AI precision using GPT-4.

### Smart Escrow
- Risk assessment for milestone payments
- Payment schedule optimization
- Fraud detection
- Automated releases based on quality scores

### Quality Scoring
AI evaluates submissions against objective criteria with detailed feedback and scoring.

### PFI Score
Professional Fidelity Index (300-900) tracks freelancer reliability and performance.

### Firebase Integration
- Secure authentication with multiple providers
- Real-time database with Firestore
- Automatic data persistence
- Fallback to in-memory storage if Firebase unavailable

## API Endpoints

### Projects
- `POST /api/projects/create` - Create new project with AI decomposition
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects/clarify` - Clarify project description

### Milestones
- `POST /api/milestones/submit` - Submit milestone work
- `GET /api/projects/{id}/milestones` - Get project milestones

### Escrow
- `GET /api/escrow/{vault_id}` - Get vault status
- `POST /api/escrow/assess-risk` - Assess payment risk
- `POST /api/escrow/optimize-schedule` - Optimize payment schedule
- `POST /api/escrow/detect-fraud` - Detect fraud signals

### Freelancer
- `GET /api/freelancer/{id}/pfi` - Get PFI score

## Environment Variables

### Backend (.env)
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `STRIPE_SECRET_KEY` - Stripe key for payments (optional)
- `DATABASE_URL` - Database connection string
- `FIREBASE_SERVICE_ACCOUNT_PATH` - Path to Firebase service account JSON

### Frontend (.env.local)
- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Development

### Mock Mode
If OpenAI API key is not set, the system automatically uses mock implementations for testing.

### Firebase Fallback
If Firebase is not configured, the system falls back to in-memory storage.

## Security

- Firebase Authentication for secure user management
- Firestore Security Rules for data protection
- Token-based API authentication
- Environment variables for sensitive data
- Service account for backend Firebase access

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check FIREBASE_SETUP.md for Firebase configuration
- Review API documentation at http://localhost:9001/docs
- Open an issue on GitHub

---

Built with ❤️ using AI, FastAPI, Next.js, and Firebase
