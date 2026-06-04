/**
 * Seed Firestore with test data.
 * Run from project root: npm run seed
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log('Starting Sahayam seed...');

  const adminId = 'admin_user_1';
  await setDoc(doc(db, 'users', adminId), {
    uid: adminId,
    name: 'Admin User',
    email: 'admin@sahayam.com',
    phone: '+919999999999',
    role: 'admin',
    createdAt: new Date(),
  });

  const members = [
    {
      id: 'member_1',
      name: 'Raju',
      phone: '+918888888881',
      role: 'member',
      address: 'Downtown 123 Main St',
      age: 65,
    },
    {
      id: 'member_2',
      name: 'Lakshmi',
      phone: '+918888888882',
      role: 'member',
      address: 'Suburb 456 Oak St',
      age: 72,
    },
  ];
  for (const m of members) {
    await setDoc(doc(db, 'users', m.id), { ...m, uid: m.id, createdAt: new Date() });
  }

  const volunteers = [
    {
      id: 'vol_1',
      name: 'Ravi',
      phone: '+917777777771',
      role: 'volunteer',
      area: 'Downtown',
      isAvailable: true,
      rating: 4.8,
      totalRatings: 10,
      activeTaskId: null,
    },
    {
      id: 'vol_2',
      name: 'Sita',
      phone: '+917777777772',
      role: 'volunteer',
      area: 'Suburb',
      isAvailable: true,
      rating: 5.0,
      totalRatings: 3,
      activeTaskId: null,
    },
    {
      id: 'vol_3',
      name: 'Kiran',
      phone: '+917777777773',
      role: 'volunteer',
      area: 'Downtown',
      isAvailable: false,
      rating: 4.2,
      totalRatings: 5,
      activeTaskId: null,
    },
  ];
  for (const v of volunteers) {
    await setDoc(doc(db, 'users', v.id), {
      uid: v.id,
      name: v.name,
      phone: v.phone,
      role: v.role,
      createdAt: new Date(),
    });
    await setDoc(doc(db, 'volunteers', v.id), {
      uid: v.id,
      name: v.name,
      area: v.area,
      isAvailable: v.isAvailable,
      rating: v.rating,
      totalRatings: v.totalRatings,
      activeTaskId: v.activeTaskId,
    });
  }

  const requests = [
    {
      memberId: 'member_1',
      memberName: 'Raju',
      memberAddress: 'Downtown 123 Main St',
      type: 'medicine',
      priority: 'normal',
      description: 'Need BP tablets',
      status: 'pending',
      assignedVolunteerId: null,
      assignedVolunteerName: null,
      photoUrl: null,
      rating: null,
      createdAt: new Date(),
    },
    {
      memberId: 'member_2',
      memberName: 'Lakshmi',
      memberAddress: 'Suburb 456 Oak St',
      type: 'emergency',
      priority: 'emergency',
      description: 'Fell down, need help to get to hospital',
      status: 'accepted',
      assignedVolunteerId: 'vol_2',
      assignedVolunteerName: 'Sita',
      photoUrl: null,
      rating: null,
      createdAt: new Date(),
    },
    {
      memberId: 'member_1',
      memberName: 'Raju',
      memberAddress: 'Downtown 123 Main St',
      type: 'grocery',
      priority: 'normal',
      description: 'Need 1kg rice and dal',
      status: 'on_the_way',
      assignedVolunteerId: 'vol_1',
      assignedVolunteerName: 'Ravi',
      photoUrl: null,
      rating: null,
      createdAt: new Date(),
    },
    {
      memberId: 'member_2',
      memberName: 'Lakshmi',
      memberAddress: 'Suburb 456 Oak St',
      type: 'complaint',
      priority: 'normal',
      description: 'Street light not working',
      status: 'completed',
      assignedVolunteerId: 'vol_3',
      assignedVolunteerName: 'Kiran',
      photoUrl: null,
      rating: 4,
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      memberId: 'member_1',
      memberName: 'Raju',
      memberAddress: 'Downtown 123 Main St',
      type: 'other',
      priority: 'normal',
      description: 'Need help moving a box',
      status: 'cancelled',
      assignedVolunteerId: null,
      assignedVolunteerName: null,
      photoUrl: null,
      rating: null,
      createdAt: new Date(Date.now() - 172800000),
    },
  ];

  for (const r of requests) {
    const docRef = await addDoc(collection(db, 'requests'), {
      ...r,
      updatedAt: new Date(),
    });
    if (r.assignedVolunteerId && ['accepted', 'on_the_way'].includes(r.status)) {
      await setDoc(
        doc(db, 'volunteers', r.assignedVolunteerId),
        { activeTaskId: docRef.id },
        { merge: true }
      );
    }
  }

  console.log('Seed completed: 1 admin, 2 members, 3 volunteers, 5 requests.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
