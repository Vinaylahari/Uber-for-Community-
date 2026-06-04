import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import PortalShell from '../../components/PortalShell';
import { db, storage } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { autoAssignVolunteer } from '../../firebase/helpers';
import toast from 'react-hot-toast';
import { FaArrowLeft } from 'react-icons/fa';

export default function RaiseRequest() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  
  const typeFromState = location.state?.type || 'other';
  
  const [type, setType] = useState(typeFromState);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(userData?.address || '');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !address.trim()) {
      toast.error('Description and address are required');
      return;
    }
    
    setLoading(true);
    try {
      let photoUrl = null;
      if (photo) {
        const storageRef = ref(storage, `requests/${currentUser.uid}_${Date.now()}_${photo.name}`);
        await uploadBytes(storageRef, photo);
        photoUrl = await getDownloadURL(storageRef);
      }

      const priority = type === 'emergency' ? 'emergency' : 'normal';

      const requestData = {
        memberId: currentUser.uid,
        memberName: userData?.name || 'Citizen',
        memberAddress: address,
        type,
        priority,
        description,
        photoUrl,
        status: 'pending',
        assignedVolunteerId: null,
        assignedVolunteerName: null,
        rating: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'requests'), requestData);
      
      // Attempt auto-assign
      const assigned = await autoAssignVolunteer(docRef.id, address);
      
      if (assigned) {
        toast.success('Request raised and a volunteer has been assigned!');
      } else {
        toast.success('Request raised! We will assign a volunteer shortly.');
      }
      
      navigate('/member/track');
    } catch (error) {
      console.error(error);
      toast.error('Failed to raise request. Please try again.');
    }
    setLoading(false);
  };

  return (
    <PortalShell className="p-4 pb-8">
      <div className="flex items-center mb-6 pt-2">
        <button type="button" onClick={() => navigate(-1)} className="p-2 mr-2 bg-gray-200 rounded-full active:scale-95 min-h-[48px] min-w-[48px] flex items-center justify-center">
          <FaArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">{t('raise_request')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Help Type</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="emergency">Emergency</option>
            <option value="medicine">Medicine Help</option>
            <option value="grocery">Grocery Help</option>
            <option value="complaint">Complaint</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            placeholder="Describe what you need help with..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
          <textarea 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows="2"
            placeholder="Your full address..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Photo (Optional)</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0])}
            className="w-full p-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-primary text-white py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 mt-4 active:scale-95"
        >
          {loading ? 'Submitting...' : t('submit')}
        </button>
      </form>
    </PortalShell>
  );
}
