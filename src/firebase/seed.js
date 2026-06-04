/** @deprecated Use `npm run seed` (firebase/seed.js at project root). */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log('Starting seed...');

  try {
    // Admins
    const adminId = 'admin_user_1';
    await setDoc(doc(db, 'users', adminId), {
      uid: adminId,
      name: 'Admin User',
      phone: '+919999999999',
      role: 'admin',
      createdAt: new Date()
    });

    // Members
    const members = [
      { id: 'member_1', name: 'Raju', phone: '+918888888881', role: 'member', address: '123 Main St, Downtown', age: 65 },
      { id: 'member_2', name: 'Lakshmi', phone: '+918888888882', role: 'member', address: '456 Oak St, Suburb', age: 72 }
    ];
    for (const m of members) {
      await setDoc(doc(db, 'users', m.id), { ...m, createdAt: new Date(), uid: m.id });
    }

    // Volunteers
    const volunteers = [
      { id: 'vol_1', name: 'Ravi', phone: '+917777777771', role: 'volunteer', area: 'Downtown', isAvailable: true, rating: 4.8, totalRatings: 10, activeTaskId: null },
      { id: 'vol_2', name: 'Sita', phone: '+917777777772', role: 'volunteer', area: 'Suburb', isAvailable: true, rating: 5.0, totalRatings: 3, activeTaskId: null },
      { id: 'vol_3', name: 'Kiran', phone: '+917777777773', role: 'volunteer', area: 'Downtown', isAvailable: false, rating: 4.2, totalRatings: 5, activeTaskId: null }
    ];
    for (const v of volunteers) {
      await setDoc(doc(db, 'users', v.id), { uid: v.id, name: v.name, phone: v.phone, role: v.role, createdAt: new Date() });
      const { role, phone, ...volData } = v; // don't need all user data in volunteer doc
      await setDoc(doc(db, 'volunteers', v.id), { uid: v.id, ...volData });
    }

    // Requests
    const requests = [
      { memberId: 'member_1', memberName: 'Raju', memberAddress: '123 Main St, Downtown', type: 'medicine', priority: 'normal', description: 'Need BP tablets', status: 'pending', assignedVolunteerId: null, createdAt: new Date() },
      { memberId: 'member_2', memberName: 'Lakshmi', memberAddress: '456 Oak St, Suburb', type: 'emergency', priority: 'emergency', description: 'Fell down, need help to get to hospital', status: 'accepted', assignedVolunteerId: 'vol_2', assignedVolunteerName: 'Sita', createdAt: new Date() },
      { memberId: 'member_1', memberName: 'Raju', memberAddress: '123 Main St, Downtown', type: 'grocery', priority: 'normal', description: 'Need 1kg rice and dal', status: 'on_the_way', assignedVolunteerId: 'vol_1', assignedVolunteerName: 'Ravi', createdAt: new Date() },
      { memberId: 'member_2', memberName: 'Lakshmi', memberAddress: '456 Oak St, Suburb', type: 'complaint', priority: 'normal', description: 'Street light not working', status: 'completed', assignedVolunteerId: 'vol_3', assignedVolunteerName: 'Kiran', rating: 4, createdAt: new Date(Date.now() - 86400000) },
      { memberId: 'member_1', memberName: 'Raju', memberAddress: '123 Main St, Downtown', type: 'other', priority: 'normal', description: 'Need help moving a box', status: 'cancelled', assignedVolunteerId: null, createdAt: new Date(Date.now() - 172800000) }
    ];

    for (const r of requests) {
      const docRef = await addDoc(collection(db, 'requests'), { ...r, updatedAt: new Date() });
      if (r.status === 'accepted' || r.status === 'on_the_way') {
        // update volunteer's active task
        await setDoc(doc(db, 'volunteers', r.assignedVolunteerId), { activeTaskId: docRef.id }, { merge: true });
      }
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
