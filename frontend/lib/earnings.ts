import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EarningEntry } from "@/app/payment/page";

export async function recordEarning(
  uid: string,
  entry: Omit<EarningEntry, "id" | "createdAt">,
) {
  const id = `earn_${Date.now()}`;
  await setDoc(doc(db, "users", uid, "earnings", id), {
    ...entry,
    createdAt: serverTimestamp(),
  });
}
