'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Calendar, Link2, FileText, Loader2, CheckCircle2, Upload, X, Wallet } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { onAuthChange } from '@/lib/auth';
import type { User as FirebaseUser } from 'firebase/auth';

interface ProfileData {
  legalName: string;
  dateOfBirth: string;
  primaryEmail: string;
  secondaryEmail: string;
  phone: string;
  address: string;
  availability: string;
  resumeUrl: string;
  resumeName: string;
  linkedinUrl: string;
  profileComplete: boolean;
  paypalEmail: string;
  paypalConnected: boolean;
}

const empty: ProfileData = {
  legalName: '',
  dateOfBirth: '',
  primaryEmail: '',
  secondaryEmail: '',
  phone: '',
  address: '',
  availability: 'full-time',
  resumeUrl: '',
  resumeName: '',
  linkedinUrl: '',
  profileComplete: false,
  paypalEmail: '',
  paypalConnected: false,
};

const inputCls = "h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-green-500/60 placeholder:text-muted-foreground/60";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<ProfileData>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          legalName: data.legalName ?? data.displayName ?? '',
          dateOfBirth: data.dateOfBirth ?? '',
          primaryEmail: data.primaryEmail ?? u.email ?? '',
          secondaryEmail: data.secondaryEmail ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          availability: data.availability ?? 'full-time',
          resumeUrl: data.resumeUrl ?? '',
          resumeName: data.resumeName ?? '',
          linkedinUrl: data.linkedinUrl ?? '',
          profileComplete: data.profileComplete ?? false,
          paypalEmail: data.paypalEmail ?? '',
          paypalConnected: data.paypalConnected ?? false,
        });
      } else {
        setProfile((p) => ({ ...p, primaryEmail: u.email ?? '' }));
      }
      setLoading(false);
    });
    return unsub;
  }, [router]);

  const handleResumeUpload = (file: File) => {
    if (!user) return;
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be under 5 MB.');
      return;
    }
    setUploadError('');
    setUploadProgress(0);

    const storageRef = ref(storage, `resumes/${user.uid}/${file.name}`);
    const task = uploadBytesResumable(storageRef, file, { contentType: 'application/pdf' });

    task.on(
      'state_changed',
      (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => { setUploadError('Upload failed. Try again.'); setUploadProgress(null); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setProfile((p) => ({ ...p, resumeUrl: url, resumeName: file.name }));
        setUploadProgress(null);
      }
    );
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleResumeUpload(file);
  };

  const [paypalSaving, setPaypalSaving] = useState(false);
  const [paypalError, setPaypalError] = useState('');

  const handleSavePayPal = async () => {
    if (!user) return;
    if (!profile.paypalEmail.includes('@')) { setPaypalError('Enter a valid PayPal email'); return; }
    setPaypalSaving(true);
    setPaypalError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001/api';

      // Step 1: verify the PayPal account exists
      const verifyRes = await fetch(`${apiUrl}/paypal/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.paypalEmail }),
      });
      const verify = await verifyRes.json();

      if (verify.mock) {
        // No real keys configured — skip verification, warn user
        setPaypalError('⚠️ PayPal keys not configured — skipping account verification. Add real keys to enable this check.');
        // Still allow connecting in dev/mock mode
      } else if (verify.warning) {
        // Payouts API not enabled — can't verify, but allow connecting
        setPaypalError(`⚠️ ${verify.warning}`);
        // Continue to save
      } else if (!verify.exists) {
        setPaypalError(verify.error || 'No PayPal account found for this email address.');
        setPaypalSaving(false);
        return;
      }

      // Step 2: save to backend + Firestore
      const res = await fetch(`${apiUrl}/paypal/freelancer-onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancer_id: user.uid, paypal_email: profile.paypalEmail }),
      });
      const data = await res.json();
      if (data.connected) {
        setProfile((p) => ({ ...p, paypalConnected: true }));
        await setDoc(doc(db, 'users', user.uid), { paypalEmail: profile.paypalEmail, paypalConnected: true }, { merge: true });
      } else {
        setPaypalError('Failed to connect. Try again.');
      }
    } catch {
      setPaypalError('Network error. Try again.');
    } finally {
      setPaypalSaving(false);
    }
  };

  const handleDisconnectPayPal = async () => {
    if (!user) return;
    setProfile((p) => ({ ...p, paypalEmail: '', paypalConnected: false }));
    await setDoc(doc(db, 'users', user.uid), { paypalEmail: '', paypalConnected: false }, { merge: true });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const isComplete = !!(
        profile.legalName &&
        profile.dateOfBirth &&
        profile.primaryEmail &&
        profile.phone &&
        profile.address
      );
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        profileComplete: isComplete,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setProfile((p) => ({ ...p, profileComplete: isComplete }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof ProfileData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setProfile((p) => ({ ...p, [field]: e.target.value }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.06),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(240,253,250,0.86)_52%,_rgba(255,255,255,1))]">
      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.06),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(240,253,250,0.86)_52%,_rgba(255,255,255,1))] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">

        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600">My Account</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-foreground">Manage your account information</h1>
          {!profile.profileComplete && (
            <div className="mt-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700">
              Complete your profile to browse and apply to projects.
            </div>
          )}
          {profile.profileComplete && (
            <div className="mt-4 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Profile complete
            </div>
          )}
        </div>

        <motion.form
          onSubmit={handleSave}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-6"
        >
          {/* Account ID */}
          <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-green-600" /> Account ID
            </h2>
            <div className="h-11 w-full rounded-xl border border-border/40 bg-foreground/[0.03] px-4 flex items-center text-sm text-muted-foreground font-mono select-all">
              {user?.uid ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">System-assigned. Cannot be changed.</p>
          </div>

          {/* Personal Info */}
          <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-green-600" /> Personal Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Legal Name <span className="text-red-500">*</span></label>
                <input type="text" value={profile.legalName} onChange={set('legalName')} placeholder="Full legal name" required className={inputCls} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date of Birth <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="date" value={profile.dateOfBirth} onChange={set('dateOfBirth')} required className={`${inputCls} pl-10`} />
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-600" /> Contact
            </h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Primary Email <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={profile.primaryEmail} onChange={set('primaryEmail')} placeholder="your@email.com" required className={`${inputCls} pl-10`} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Secondary Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={profile.secondaryEmail} onChange={set('secondaryEmail')} placeholder="backup@email.com" className={`${inputCls} pl-10`} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone Number <span className="text-red-500">*</span></label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="tel" value={profile.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" required className={`${inputCls} pl-10`} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Address <span className="text-red-500">*</span></label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-3 h-4 w-4 text-muted-foreground" />
                <textarea value={profile.address} onChange={set('address')} placeholder="Street, City, State, Country" rows={2} required className="w-full rounded-xl border border-border/50 bg-background pl-10 pr-4 py-3 text-sm outline-none transition focus:border-green-500/60 resize-none placeholder:text-muted-foreground/60" />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" /> Availability
            </h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Available on</label>
              <select value={profile.availability} onChange={set('availability')} className={inputCls}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="weekends">Weekends only</option>
                <option value="contract">Contract / Project basis</option>
                <option value="not-available">Not available</option>
              </select>
            </div>
          </div>

          {/* Resume + LinkedIn */}
          <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-6 space-y-5">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" /> Resume & Links
            </h2>

            {/* PDF Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Resume <span className="text-xs text-muted-foreground">(PDF only, max 5 MB)</span></label>

              {profile.resumeUrl ? (
                <div className="flex items-center justify-between rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-green-700 min-w-0">
                    <FileText className="w-4 h-4 shrink-0" />
                    <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                      {profile.resumeName || 'resume.pdf'}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, resumeUrl: '', resumeName: '' }))}
                    className="ml-3 shrink-0 text-muted-foreground hover:text-red-500 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 bg-background px-4 py-8 text-center transition hover:border-green-500/50 hover:bg-green-500/5"
                >
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop your PDF here, or <span className="text-green-600 font-medium">click to browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground/60">PDF only · Max 5 MB</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f); }}
              />

              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading...</span><span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border/40">
                    <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-red-500">{uploadError}</p>
              )}
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">LinkedIn</label>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="url" value={profile.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/yourname" className={`${inputCls} pl-10`} />
              </div>
            </div>
          </div>

          {/* PayPal */}
          <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4 text-green-600" /> Payment — PayPal
            </h2>
            <p className="text-sm text-muted-foreground">
              Connect your PayPal to send or receive milestone payments. Employers pay via PayPal checkout; freelancers receive payouts to this email.
            </p>

            {profile.paypalConnected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{profile.paypalEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnectPayPal}
                    className="ml-3 shrink-0 text-xs text-muted-foreground hover:text-red-500 transition"
                  >
                    Disconnect
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">PayPal connected. Payments will be sent to this account.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">PayPal email address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={profile.paypalEmail}
                      onChange={(e) => setProfile((p) => ({ ...p, paypalEmail: e.target.value }))}
                      placeholder="your-paypal@email.com"
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                </div>

                {paypalError && (
                  <p className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                    <span className="mt-0.5 shrink-0">✕</span>
                    {paypalError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSavePayPal}
                  disabled={paypalSaving || !profile.paypalEmail}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0070ba] px-5 text-sm font-medium text-white transition hover:bg-[#005ea6] disabled:opacity-50"
                >
                  {paypalSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {paypalSaving ? 'Verifying account...' : 'Connect PayPal'}
                </button>
              </div>
            )}
          </div>

          {/* Save */}
          <motion.button
            type="submit"
            disabled={saving || uploadProgress !== null}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : null}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}
