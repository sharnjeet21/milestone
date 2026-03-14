import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";
import type { FreelancerProfile, Project } from "./types";

// ── Projects ──────────────────────────────────────────────────────────────────

export async function fsGetProject(projectId: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, "projects", projectId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Project;
}

export async function fsGetProjects(opts?: {
  employerId?: string;
  freelancerId?: string;
  max?: number;
}): Promise<Project[]> {
  let q;

  if (opts?.employerId) {
    q = query(
      collection(db, "projects"),
      where("employer_id", "==", opts.employerId),
      orderBy("createdAt", "desc"),
    );
  } else if (opts?.freelancerId) {
    q = query(
      collection(db, "projects"),
      where("freelancer_id", "==", opts.freelancerId),
      orderBy("createdAt", "desc"),
    );
  } else {
    q = query(
      collection(db, "projects"),
      orderBy("createdAt", "desc"),
      limit(opts?.max ?? 50),
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project);
}

export async function fsUpdateProject(
  projectId: string,
  updates: Partial<Project>,
): Promise<void> {
  await updateDoc(doc(db, "projects", projectId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ── Freelancers ───────────────────────────────────────────────────────────────

export async function fsGetFreelancer(
  freelancerId: string,
): Promise<FreelancerProfile | null> {
  const snap = await getDoc(doc(db, "users", freelancerId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FreelancerProfile;
}

export async function fsUpsertFreelancer(
  freelancerId: string,
  data: Partial<FreelancerProfile>,
): Promise<void> {
  await setDoc(
    doc(db, "users", freelancerId),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

// ── Vaults ────────────────────────────────────────────────────────────────────

export async function fsGetVault(vaultId: string): Promise<Record<string, unknown> | null> {
  const snap = await getDoc(doc(db, "vaults", vaultId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
