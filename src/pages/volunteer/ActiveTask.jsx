import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { db, storage } from '../../firebase/firebase';
import { doc, updateDoc, onSnapshot, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaCheckCircle,
  FaListUl,
  FaTasks,
  FaHistory,
  FaArrowLeft,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import PortalShell from '../../components/PortalShell';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function ActiveTask() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [task, setTask] = useState(null);
  const [memberPhone, setMemberPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!currentUser) return undefined;

    let unsubReq = () => {};

    const unsubVol = onSnapshot(doc(db, 'volunteers', currentUser.uid), async (docSnap) => {
      if (docSnap.exists() && docSnap.data().activeTaskId) {
        const taskId = docSnap.data().activeTaskId;

        unsubReq = onSnapshot(doc(db, 'requests', taskId), async (reqSnap) => {
          if (reqSnap.exists()) {
            const data = { id: reqSnap.id, ...reqSnap.data() };
            setTask(data);
            if (data.memberId) {
              const memberSnap = await getDoc(doc(db, 'users', data.memberId));
              if (memberSnap.exists()) {
                setMemberPhone(memberSnap.data().phone || '');
              }
            }
          } else {
            setTask(null);
          }
          setLoading(false);
        });
      } else {
        setTask(null);
        setLoading(false);
      }
    });

    return () => {
      unsubVol();
      unsubReq();
    };
  }, [currentUser]);

  const handleUpdateStatus = async (newStatus) => {
    if (!task) return;
    setUpdating(true);
    try {
      let photoUrl = null;
      if (newStatus === 'completed' && photo) {
        const storageRef = ref(
          storage,
          `completions/${task.id}_${Date.now()}_${photo.name}`
        );
        await uploadBytes(storageRef, photo);
        photoUrl = await getDownloadURL(storageRef);
      }

      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };
      if (photoUrl) updateData.completionPhotoUrl = photoUrl;

      await updateDoc(doc(db, 'requests', task.id), updateData);

      if (newStatus === 'completed') {
        await updateDoc(doc(db, 'volunteers', currentUser.uid), {
          activeTaskId: null,
        });
        toast.success('Task completed successfully!');
        navigate('/volunteer/history');
      } else {
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status.');
    }
    setUpdating(false);
  };

  return (
    <PortalShell className="pb-20">
      <header className="bg-primary text-white p-4 flex items-center shadow-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 mr-2 active:scale-95 min-h-[48px]"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-xl font-bold">{t('active')}</h1>
      </header>

      <main className="p-4 mt-2">
        {loading ? (
          <LoadingSpinner />
        ) : !task ? (
          <EmptyState
            icon={FaTasks}
            title="No Active Task"
            message={t('no_active_task')}
          />
        ) : (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="border-b pb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase">
                {task.type}
              </span>
              <h2 className="text-2xl font-bold text-gray-800 mt-2">{task.memberName}</h2>
              <p className="text-sm font-semibold capitalize text-primary mt-1">
                {task.status.replace('_', ' ')}
              </p>
            </div>

            {memberPhone && (
              <a
                href={`tel:${memberPhone}`}
                className="flex items-center gap-3 bg-green-50 p-4 rounded-xl border border-green-100 min-h-[48px]"
              >
                <FaPhoneAlt className="text-success text-xl" />
                <div>
                  <p className="text-sm text-gray-500 font-semibold">Member Phone</p>
                  <p className="font-bold text-lg text-gray-800">{memberPhone}</p>
                </div>
              </a>
            )}

            <div className="flex items-start">
              <div className="bg-gray-100 p-3 rounded-full mr-4 text-primary">
                <FaMapMarkerAlt />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold mb-1">Address</p>
                <p className="font-medium text-base">{task.memberAddress}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border">
              <p className="text-sm text-gray-500 font-semibold mb-2">Request Description</p>
              <p className="text-gray-800 font-medium text-base">{task.description}</p>
              {task.photoUrl && (
                <img
                  src={task.photoUrl}
                  alt="Request"
                  className="mt-3 rounded-lg w-full max-h-60 object-cover"
                />
              )}
            </div>

            <div className="pt-4 border-t space-y-4">
              {task.status === 'accepted' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('on_the_way')}
                  disabled={updating}
                  className="w-full bg-warning text-white py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
                >
                  <FaMotorcycle /> {t('mark_on_way')}
                </button>
              )}

              {(task.status === 'accepted' || task.status === 'on_the_way') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Proof of Completion (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhoto(e.target.files[0])}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={updating}
                    className="w-full bg-success text-white py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
                  >
                    <FaCheckCircle /> {t('mark_completed')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && !task && (
          <button
            type="button"
            onClick={() => navigate('/volunteer')}
            className="w-full mt-6 bg-primary text-white px-6 py-3 rounded-lg font-semibold min-h-[48px]"
          >
            Browse Requests
          </button>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-white border-t flex justify-around p-3 z-10">
        <button
          type="button"
          onClick={() => navigate('/volunteer')}
          className="flex flex-col items-center text-gray-500 min-h-[48px]"
        >
          <FaListUl className="text-2xl" />
          <span className="text-xs font-bold mt-1">{t('feed')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/volunteer/active')}
          className="flex flex-col items-center text-primary min-h-[48px]"
        >
          <FaTasks className="text-2xl" />
          <span className="text-xs font-bold mt-1">{t('active')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/volunteer/history')}
          className="flex flex-col items-center text-gray-500 min-h-[48px]"
        >
          <FaHistory className="text-2xl" />
          <span className="text-xs font-bold mt-1">{t('history')}</span>
        </button>
      </nav>
    </PortalShell>
  );
}
