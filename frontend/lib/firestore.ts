import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// Projects
export const createProject = async (projectId: string, projectData: any) => {
  await setDoc(doc(db, 'projects', projectId), {
    ...projectData,
    createdAt: Timestamp.now(),
  });
};

export const getProject = async (projectId: string) => {
  const projectDoc = await getDoc(doc(db, 'projects', projectId));
  return projectDoc.exists() ? { id: projectDoc.id, ...projectDoc.data() } : null;
};

export const getProjects = async (userId?: string, role?: 'employer' | 'freelancer') => {
  let q;
  if (userId && role === 'employer') {
    q = query(collection(db, 'projects'), where('employer_id', '==', userId), orderBy('createdAt', 'desc'));
  } else if (userId && role === 'freelancer') {
    q = query(collection(db, 'projects'), where('freelancer_id', '==', userId), orderBy('createdAt', 'desc'));
  } else {
    q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(50));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateProject = async (projectId: string, updates: any) => {
  await updateDoc(doc(db, 'projects', projectId), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

// Milestones
export const updateMilestone = async (projectId: string, milestoneId: string, updates: any) => {
  const projectDoc = await getDoc(doc(db, 'projects', projectId));
  if (projectDoc.exists()) {
    const project = projectDoc.data();
    const milestones = project.milestones.map((m: any) =>
      m.id === milestoneId ? { ...m, ...updates } : m
    );
    await updateDoc(doc(db, 'projects', projectId), { milestones });
  }
};

// Freelancers
export const updateFreelancerPFI = async (freelancerId: string, pfiScore: number) => {
  await updateDoc(doc(db, 'users', freelancerId), {
    pfiScore,
    updatedAt: Timestamp.now(),
  });
};

export const getFreelancer = async (freelancerId: string) => {
  const userDoc = await getDoc(doc(db, 'users', freelancerId));
  return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
};

// Escrow Vaults
export const createVault = async (vaultId: string, vaultData: any) => {
  await setDoc(doc(db, 'vaults', vaultId), {
    ...vaultData,
    createdAt: Timestamp.now(),
  });
};

export const getVault = async (vaultId: string) => {
  const vaultDoc = await getDoc(doc(db, 'vaults', vaultId));
  return vaultDoc.exists() ? { id: vaultDoc.id, ...vaultDoc.data() } : null;
};

export const updateVault = async (vaultId: string, updates: any) => {
  await updateDoc(doc(db, 'vaults', vaultId), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

// Transactions
export const addTransaction = async (vaultId: string, transaction: any) => {
  const vaultDoc = await getDoc(doc(db, 'vaults', vaultId));
  if (vaultDoc.exists()) {
    const vault = vaultDoc.data();
    const transactions = [...(vault.transactions || []), transaction];
    await updateDoc(doc(db, 'vaults', vaultId), { transactions });
  }
};
