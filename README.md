<div align="center">

# 🚀 MilestoneAI <!-- updated -->

### *The AI-Powered Freelance Platform That Guarantees Work Gets Done — and Gets Paid*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-milestone--i9lk.onrender.com-green?style=for-the-badge)](https://milestone-i9lk.onrender.com)
[![Backend](https://img.shields.io/badge/⚡_Backend_API-Operational-brightgreen?style=for-the-badge)](https://milestoneai-backend.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> **The problem with freelancing isn't finding work. It's trust.**
> Employers fear paying for work that never arrives. Freelancers fear working for clients who never pay.
> **MilestoneAI solves both — with AI, escrow, and enforceable contracts.**

</div>

---

## 🎯 The Problem We're Solving

The global freelance market is worth **$1.5 trillion** — yet it's broken at its core:

| Pain Point | Reality |
|---|---|
| 💸 Payment disputes | 71% of freelancers report late or non-payment |
| 📋 Scope creep | Employers add work without paying more |
| ⭐ Fake ratings | Star systems are gamed and meaningless |
| 📄 No legal protection | Verbal agreements, no enforceable contracts |
| 🔍 Bad hiring | Employers can't objectively evaluate freelancer quality |

**MilestoneAI is the platform that fixes all of this — simultaneously.**

---

## ✨ What Makes Us Different

### 🤖 AI at the Core — Not as a Feature, but as Infrastructure

Every critical decision on MilestoneAI is powered by AI:

- **AI evaluates milestone submissions** — not humans, not stars. The AI reads the work, checks it against the agreed checklist, and releases payment automatically.
- **AI generates project roadmaps** — describe your project in plain English, get a structured milestone plan with payment splits in seconds.
- **AI scores freelancers** — our **PFI (Performance Fidelity Index)** is a credit-score-like metric built from real delivery data, not subjective reviews.
- **AI clarifies project briefs** — before a project starts, AI identifies ambiguous requirements and asks the right questions.

### 🔒 Escrow That Actually Works

```
Employer deposits funds → Funds locked in vault → Freelancer completes milestone
→ AI verifies work → Payment auto-released → Both parties protected
```

No more "I'll pay you when I'm happy." The money is already there. The AI decides.

### 📊 PFI Score — The Freelancer Credit Score

Forget 5-star ratings. The **Performance Fidelity Index** tracks:
- On-time delivery rate
- Quality scores across milestones
- Revision frequency
- Completion consistency

A freelancer with PFI 850 is objectively better than one with PFI 600 — and employers can see exactly why.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│              Next.js 14 · TypeScript · Tailwind              │
│         Framer Motion · Firebase Auth · Firestore            │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────────┐
│                        BACKEND                               │
│              FastAPI · Python · OpenAI GPT-4                 │
│         Firebase Admin · PayPal SDK · Pydantic               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      DATABASE                                │
│              Firebase Firestore (NoSQL)                      │
│         Real-time sync · Offline support · Scalable          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌟 Feature Showcase

### For Employers

| Feature | Description |
|---|---|
| 🧠 **AI Project Brief** | Type your idea in plain English — AI structures it into milestones with budgets |
| 🔍 **Smart Freelancer Search** | Search by skill, PFI score, availability, and past performance |
| 💰 **Escrow Vault** | Lock funds before work starts — release only when AI confirms delivery |
| 📄 **Auto-Generated MOU** | Legally-structured contracts created from your project terms |
| ⚖️ **Dispute Centre** | Raise disputes — escrow freezes automatically until resolved |
| 📊 **Project Dashboard** | Real-time milestone tracking with AI risk assessment |

### For Freelancers

| Feature | Description |
|---|---|
| 📈 **PFI Score** | Your objective reputation — built from real delivery data |
| 🛡️ **Legal Protections** | Illness clauses, scope creep shields, unfair penalty protection — enforced by the platform |
| 💼 **Portfolio** | Showcase work with employer ratings and project links |
| 🤝 **Task Sharing** | Share milestone tasks with fellow freelancers with one click |
| 💬 **Direct Messaging** | Chat with employers directly within the platform |
| 📋 **Task Board** | Kanban-style task management with collaboration features |

### Platform-Wide

| Feature | Description |
|---|---|
| 🔐 **Firebase Auth** | Google, GitHub, and email sign-in |
| 💳 **PayPal Integration** | Real payment processing with sandbox support |
| 📱 **Fully Responsive** | Works on mobile, tablet, and desktop |
| 🌙 **Dark Mode** | System-aware theme switching |
| ⚡ **Real-time Updates** | Firestore live sync across all clients |

---

## 🤖 AI Agents

MilestoneAI runs **5 specialized AI agents** under the hood:

```python
NLPAgent          → Parses project descriptions, extracts requirements
QualityAgent      → Evaluates milestone submissions against checklists  
PFIAgent          → Calculates and updates freelancer performance scores
EscrowAgent       → Manages fund release decisions based on AI evaluation
PaymentAgent      → Optimizes payment schedules and handles penalty logic
```

Each agent is independently testable, modular, and powered by GPT-4.

---

## 📁 Project Structure

```
milestone/
├── frontend/                    # Next.js 14 App Router
│   ├── app/
│   │   ├── employer/            # Employer dashboard, project creation
│   │   ├── freelancer/          # Workspace, PFI, portfolio, tasks
│   │   ├── disputes/            # Dispute management
│   │   ├── chat/                # Real-time messaging
│   │   ├── payment/             # Earnings & payouts
│   │   └── jobs/                # Job board
│   ├── components/              # AuthGuard, Navbar, EscrowVault, etc.
│   └── lib/                     # API client, Firebase, types, utils
│
├── backend/                     # FastAPI Python backend
│   ├── agents/                  # AI agents (NLP, Quality, PFI, Escrow, Payment)
│   ├── routers/                 # REST endpoints (projects, escrow, disputes, etc.)
│   ├── models/                  # Pydantic data models
│   ├── services/                # MOU generation, notifications, search
│   └── database/                # Firebase Admin integration
│
└── render.yaml                  # One-click Render deployment config
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+, Python 3.11+
- Firebase project with Firestore + Auth enabled
- OpenAI API key

### 1. Clone & Install

```bash
git clone https://github.com/sharnjeet21/milestone.git
cd milestone

# Frontend
cd frontend && npm install

# Backend
cd ../backend && pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# frontend/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_API_URL=http://localhost:9001/api

# backend/.env
OPENAI_API_KEY=your_openai_key
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend && uvicorn main:app --port 9001 --reload

# Terminal 2 — Frontend  
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deployment

Deployed on **Render** with zero-config via `render.yaml`:

- **Frontend**: `https://milestone-i9lk.onrender.com`
- **Backend API**: `https://milestoneai-backend.onrender.com`

Both services auto-deploy on every push to `main`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | FastAPI, Python 3.11, Pydantic v2 |
| **AI** | OpenAI GPT-4 (via agents) |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication |
| **Payments** | PayPal REST SDK |
| **Deployment** | Render (Docker + Node) |
| **Realtime** | Firebase Firestore live listeners |

---

## 💡 Key Technical Innovations

### 1. AI-Gated Payment Release
Payments aren't released by employer approval — they're released by AI verification. The `QualityAgent` reads the submission, evaluates each checklist item, assigns a completion score, and calculates the exact payout percentage. This removes human bias entirely.

### 2. PFI — A Credit Score for Freelancers
Unlike star ratings (which are subjective and gameable), PFI is computed from objective delivery metrics. It updates after every milestone, tracks component breakdowns (quality, deadlines, revisions), and gives employers a reliable signal.

### 3. Escrow-First Architecture
Every project starts with funds locked. The escrow vault tracks deposits, milestone payments, penalties, and refunds with a full transaction log. Neither party can manipulate the outcome — the contract terms are enforced by code.

### 4. AI-Generated Legal Documents
The MOU service generates structured contracts from project parameters — scope, milestones, payment terms, penalty clauses, and freelancer protections. Both parties sign digitally, and the contract is stored immutably.

### 5. Freelancer Rights as Platform Policy
Protections like illness extensions, scope creep shields, and unfair penalty blocks aren't just features — they're embedded in every contract and enforced automatically. Employers literally cannot override them.

---

## 📸 Pages & Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/employer/create` | AI project brief + roadmap generator |
| `/employer/dashboard` | Project overview with milestone tracking |
| `/freelancer/workspace/[id]` | Milestone submission + AI evaluation |
| `/freelancer/pfi` | PFI score dashboard with history |
| `/freelancer/portfolio` | Work showcase |
| `/freelancer/protections` | Freelancer rights management |
| `/freelancer/tasks` | Task board with sharing |
| `/escrow` | Escrow vault management |
| `/disputes` | Dispute centre |
| `/chat` | Direct messaging |
| `/payment` | Earnings & payout history |
| `/jobs` | Job board with applications |

---

## 👥 Team

Built by Team Velocity5 at **IIT Roorkee Cognizance Hackathon**

---

<div align="center">

**MilestoneAI** — *Because great work deserves guaranteed payment.*

[🌐 Live Demo](https://milestone-i9lk.onrender.com) · [📦 Repository](https://github.com/sharnjeet21/milestone)

</div>
