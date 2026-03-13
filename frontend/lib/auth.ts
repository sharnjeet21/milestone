import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'employer' | 'freelancer';
  createdAt: string;
  pfiScore?: number;
}

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string,
  role: 'employer' | 'freelancer'
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Create user profile in Firestore
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    uid: userCredential.user.uid,
    email,
    displayName,
    role,
    createdAt: new Date().toISOString(),
    pfiScore: role === 'freelancer' ? 500 : null,
  });

  return userCredential;
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// Sign in with Google
export const signInWithGoogle = async (role: 'employer' | 'freelancer'): Promise<UserCredential> => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  
  // Check if user profile exists, if not create one
  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      role,
      createdAt: new Date().toISOString(),
      pfiScore: role === 'freelancer' ? 500 : null,
    });
  }

  return userCredential;
};

// Sign in with GitHub
export const signInWithGitHub = async (role: 'employer' | 'freelancer'): Promise<UserCredential> => {
  const userCredential = await signInWithPopup(auth, githubProvider);
  
  // Check if user profile exists, if not create one
  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      role,
      createdAt: new Date().toISOString(),
      pfiScore: role === 'freelancer' ? 500 : null,
    });
  }

  return userCredential;
};

// Sign out
export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// Get user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return null;
};

// Auth state observer
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
