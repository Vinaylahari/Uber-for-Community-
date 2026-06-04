import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import PortalShell from '../../components/PortalShell';
import { db } from '../../firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setAge(userData.age || '');
      setAddress(userData.address || '');
    }
  }, [userData]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name,
        age: age ? parseInt(age) : null,
        address
      });
      toast.success('Profile updated successfully!');
      // Assuming context updates or just rely on local state/reload
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile.');
    }
    setLoading(false);
  };

  return (
    <PortalShell className="p-4 pb-8">
      <div className="flex items-center mb-6 pt-2">
        <button onClick={() => navigate(-1)} className="p-2 mr-2 bg-gray-200 rounded-full active:scale-95">
          <FaArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
          <input 
            type="text" 
            value={currentUser?.phoneNumber || userData?.phone || ''}
            disabled
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
          <input 
            type="number" 
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            placeholder="65"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
          <textarea 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
            placeholder="House No, Street, Area..."
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-xl text-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 mt-4 active:scale-95"
        >
          {loading ? 'Saving...' : t('save_profile')}
        </button>
      </form>
    </PortalShell>
  );
}
