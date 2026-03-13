# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "milestoneai")
4. Follow the setup wizard

## 2. Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable sign-in methods:
   - Email/Password
   - Google
   - GitHub (optional)

## 3. Create Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode"
4. Select a location
5. Click "Enable"

## 4. Set Firestore Rules

Go to "Firestore Database" → "Rules" and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Projects collection
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.employer_id == request.auth.uid || 
         resource.data.freelancer_id == request.auth.uid);
      allow delete: if request.auth != null && 
        resource.data.employer_id == request.auth.uid;
    }
    
    // Vaults collection
    match /vaults/{vaultId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 5. Get Frontend Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Web" icon (</>)
4. Register your app
5. Copy the config object

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

## 6. Get Backend Service Account

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as `backend/firebase-service-account.json`
4. Add to `backend/.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

## 7. Install Dependencies

Frontend:
```bash
cd frontend
npm install
```

Backend:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

## 8. Run the Project

Terminal 1 (Backend):
```bash
cd backend
source venv/bin/activate
python main.py
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## 9. Test Authentication

1. Go to http://localhost:3000
2. Click "Sign up" or "Login"
3. Create an account or sign in
4. Check Firebase Console → Authentication to see your user

## Security Notes

- Never commit `firebase-service-account.json` to git
- Never commit `.env.local` with real credentials
- Use Firebase Security Rules to protect your data
- Enable App Check for production

## Firestore Collections Structure

### users
```
{
  uid: string
  email: string
  displayName: string
  role: 'employer' | 'freelancer'
  pfiScore: number (freelancers only)
  createdAt: timestamp
}
```

### projects
```
{
  id: string
  employer_id: string
  freelancer_id: string
  title: string
  description: string
  total_budget: number
  milestones: array
  status: string
  vault_id: string
  createdAt: timestamp
}
```

### vaults
```
{
  vault_id: string
  project_id: string
  total_amount: number
  locked_amount: number
  released_amount: number
  transactions: array
  status: string
  createdAt: timestamp
}
```
