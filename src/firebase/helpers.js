import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/** First word of address for area matching */
export function getAreaFromAddress(address) {
  if (!address || typeof address !== 'string') return '';
  return address.trim().split(/\s+/)[0].toLowerCase();
}

/**
 * Auto-assign volunteer when a request is created.
 * 1. Available volunteers
 * 2. Area match (first word of address)
 * 3. Prefer no activeTaskId, then highest rating
 */
export async function autoAssignVolunteer(requestId, memberAddress) {
  try {
    const areaWord = getAreaFromAddress(memberAddress);
    const volunteersRef = collection(db, 'volunteers');
    const q = query(volunteersRef, where('isAvailable', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return false;

    const docs = [];
    for (const d of snapshot.docs) {
      const data = d.data();
      if (data.activeTaskId) continue;
      let name = data.name;
      if (!name) {
        const userSnap = await getDoc(doc(db, 'users', d.id));
        if (userSnap.exists()) name = userSnap.data().name;
      }
      docs.push({ id: d.id, ...data, name: name || 'Volunteer' });
    }

    if (docs.length === 0) return false;

    const areaMatch = areaWord
      ? docs.filter(
          (v) =>
            v.area &&
            (v.area.toLowerCase().includes(areaWord) ||
              areaWord.includes(v.area.toLowerCase().split(/\s+/)[0]))
        )
      : [];

    const pool = areaMatch.length > 0 ? areaMatch : docs;

    pool.sort((a, b) => {
      const aFree = !a.activeTaskId ? 1 : 0;
      const bFree = !b.activeTaskId ? 1 : 0;
      if (bFree !== aFree) return bFree - aFree;
      return (b.rating || 0) - (a.rating || 0);
    });

    const selected = pool[0];
    if (!selected) return false;

    await updateDoc(doc(db, 'requests', requestId), {
      assignedVolunteerId: selected.id,
      assignedVolunteerName: selected.name,
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'volunteers', selected.id), {
      activeTaskId: requestId,
    });

    return true;
  } catch (error) {
    console.error('Error in auto-assign:', error);
    return false;
  }
}
