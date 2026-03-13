# MilestoneAI - Autonomous Project Decomposition & Payment Agent

AI-powered platform that automatically breaks down projects into milestones, evaluates work quality, and manages escrow payments.

## Features

- 🤖 AI-powered project decomposition into milestones
- ✅ Automated quality evaluation with scoring
- 💰 Smart escrow payment system
- 📊 Professional Fidelity Index (PFI) scoring for freelancers
- 🔄 Automated payment releases based on completion

## Tech Stack

- Backend: FastAPI + LangChain + OpenAI
- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- Database: In-memory (easily replaceable with Firebase/Supabase)

## Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cp .env.example .env  # Add your OpenAI API key
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

## Project Structure

See the implementation guide for detailed architecture and code.
