import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { notifyUser, notifyAdmins } from './messaging.js';

initializeApp();
const db = getFirestore();

function getAreaFromAddress(address) {
  if (!address || typeof address !== 'string') return '';
  return address.trim().split(/\s+/)[0].toLowerCase();
}

async function pickVolunteer(memberAddress) {
  const areaWord = getAreaFromAddress(memberAddress);
  const snap = await db.collection('volunteers').where('isAvailable', '==', true).get();
  if (snap.empty) return null;

  const candidates = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (data.activeTaskId) continue;
    let name = data.name;
    if (!name) {
      const userSnap = await db.collection('users').doc(docSnap.id).get();
      if (userSnap.exists) name = userSnap.data().name;
    }
    candidates.push({ id: docSnap.id, ...data, name: name || 'Volunteer' });
  }

  if (candidates.length === 0) return null;

  const areaMatch = areaWord
    ? candidates.filter(
        (v) =>
          v.area &&
          (v.area.toLowerCase().includes(areaWord) ||
            areaWord.includes(String(v.area).toLowerCase().split(/\s+/)[0]))
      )
    : [];

  const pool = areaMatch.length > 0 ? areaMatch : candidates;
  pool.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return pool[0];
}

export const onRequestCreated = onDocumentCreated('requests/{requestId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const data = snap.data();
  const requestId = event.params.requestId;

  let assignedId = data.assignedVolunteerId;
  let assignedName = data.assignedVolunteerName;
  let status = data.status;

  if (status === 'pending' && !assignedId) {
    const volunteer = await pickVolunteer(data.memberAddress);
    if (volunteer) {
      const batch = db.batch();
      batch.update(snap.ref, {
        assignedVolunteerId: volunteer.id,
        assignedVolunteerName: volunteer.name,
        status: 'accepted',
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.update(db.collection('volunteers').doc(volunteer.id), {
        activeTaskId: requestId,
      });
      await batch.commit();
      assignedId = volunteer.id;
      assignedName = volunteer.name;
      status = 'accepted';
      logger.info('Auto-assigned', requestId, volunteer.id);
    } else {
      await notifyAdmins(
        'New pending request',
        `${data.memberName}: ${data.type} — ${data.description?.slice(0, 80) || ''}`,
        { requestId, url: '/admin/requests' }
      );
    }
  }

  if (data.priority === 'emergency') {
    await notifyAdmins(
      'Emergency request',
      `${data.memberName} needs help: ${data.description?.slice(0, 80) || ''}`,
      { requestId, url: '/admin' }
    );
  }

  if (assignedId) {
    await notifyUser(
      assignedId,
      'New task assigned',
      `${data.memberName} — ${data.type}`,
      { requestId, url: '/volunteer/active' }
    );
  }
});

export const onRequestUpdated = onDocumentUpdated('requests/{requestId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (!before || !after) return;

  const requestId = event.params.requestId;

  if (before.status !== after.status && after.memberId) {
    const statusLabels = {
      accepted: 'Volunteer accepted your request',
      on_the_way: 'Volunteer is on the way',
      completed: 'Request completed',
      cancelled: 'Request was cancelled',
    };
    const title = statusLabels[after.status] || 'Request updated';
    await notifyUser(after.memberId, title, after.assignedVolunteerName || '', {
      requestId,
      url: '/member/track',
    });
  }

  if (!before.assignedVolunteerId && after.assignedVolunteerId) {
    await notifyUser(
      after.assignedVolunteerId,
      'New task assigned',
      `${after.memberName} — ${after.type}`,
      { requestId, url: '/volunteer/active' }
    );
  }
});
