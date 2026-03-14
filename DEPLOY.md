# Deploy to Render

## Prerequisites
- Push this repo to GitHub (or GitLab)
- Have your PayPal sandbox keys and Firebase config ready

---

## Step 1 — Connect repo to Render

1. Go to [render.com](https://render.com) → New → **Blueprint**
2. Connect your GitHub repo
3. Render will detect `render.yaml` and create both services automatically

---

## Step 2 — Set environment variables

Render will prompt you for `sync: false` vars. Set these in the dashboard:

### Backend service (`milestoneai-backend`)
| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | your OpenAI key |
| `PAYPAL_CLIENT_ID` | your PayPal sandbox client ID |
| `PAYPAL_SECRET` | your PayPal sandbox secret |
| `PAYPAL_MODE` | `sandbox` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | paste the **entire contents** of `firebase-service-account.json` as a single-line JSON string |

### Frontend service (`milestoneai-frontend`)
| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | from Firebase console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | from Firebase console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | from Firebase console |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | same PayPal sandbox client ID |

> `NEXT_PUBLIC_API_URL` is set automatically from the backend service URL.

---

## Step 3 — Firebase Auth: add Render domain

1. Firebase Console → Authentication → Settings → Authorized domains
2. Add your Render frontend URL: `milestoneai-frontend.onrender.com`

---

## Step 4 — Deploy

Click **Deploy** in Render. Both services build and start automatically.

- Backend: `https://milestoneai-backend.onrender.com`
- Frontend: `https://milestoneai-frontend.onrender.com`

---

## Notes

- Free tier services spin down after 15 min of inactivity — first request takes ~30s to wake up
- To avoid cold starts, upgrade to the Starter plan ($7/mo per service)
- The `FIREBASE_SERVICE_ACCOUNT_JSON` value must be a valid JSON string — use `cat firebase-service-account.json | tr -d '\n'` to get a single-line version
