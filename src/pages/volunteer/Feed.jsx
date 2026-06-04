import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useVolunteer } from '../../hooks/useVolunteer';
import { db } from '../../firebase/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  FaMapMarkerAlt,
  FaClock,
  FaCheck,
  FaTimes,
  FaListUl,
  FaTasks,
  FaHistory,
} from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import PortalShell from '../../components/PortalShell';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PriorityBadge from '../../components/PriorityBadge';
import { FaInbox } from 'react-icons/fa';

const TABS = ['pending', 'emergency', 'active', 'completed'];

export default function Feed() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, userData, logout } = useAuth();
  const { volunteer } = useVolunteer();

  const [activeTab, setActiveTab] = useState('pending');
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    if (!currentUser) return undefined;

    let q;
    const ref = collection(db, 'requests');

    if (activeTab === 'pending') {
      q = query(ref, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    } else if (activeTab === 'emergency') {
      q = query(
        ref,
        where('status', '==', 'pending'),
        where('priority', '==', 'emergency'),
        orderBy('createdAt', 'desc')
      );
    } else if (activeTab === 'active') {
      q = query(
        ref,
        where('assignedVolunteerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        ref,
        where('assignedVolunteerId', '==', currentUser.uid),
        where('status', '==', 'completed'),
        orderBy('updatedAt', 'desc')
      );
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        let data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (activeTab === 'active') {
          data = data.filter((r) => ['accepted', 'on_the_way'].includes(r.status));
        }
        setAllRequests(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error('Failed to load feed. Check Firestore indexes.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser, activeTab]);

  const requests = useMemo(() => {
    let list = [...allRequests];
    if (activeTab === 'pending') {
      list = list.filter((r) => !dismissed.includes(r.id));
      list.sort((a, b) => {
        if (a.priority === 'emergency' && b.priority !== 'emergency') return -1;
        if (b.priority === 'emergency' && a.priority !== 'emergency') return 1;
        return 0;
      });
    }
    return list;
  }, [allRequests, activeTab, dismissed]);

  const handleAccept = async (req) => {
    if (volunteer?.activeTaskId) {
      toast.error('You already have an active task!');
      navigate('/volunteer/active');
      return;
    }

    try {
      const reqRef = doc(db, 'requests', req.id);
      const reqSnap = await getDoc(reqRef);
      if (reqSnap.data()?.status !== 'pending') {
        toast.error('This request was already accepted.');
        return;
      }

      await updateDoc(reqRef, {
        status: 'accepted',
        assignedVolunteerId: currentUser.uid,
        assignedVolunteerName: userData?.name || 'Volunteer',
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'volunteers', currentUser.uid), {
        activeTaskId: req.id,
      });

      toast.success('Task accepted!');
      navigate('/volunteer/active');
    } catch (error) {
      console.error(error);
      toast.error('Failed to accept task.');
    }
  };

  const handleDecline = (reqId) => {
    setDismissed((prev) => [...prev, reqId]);
    toast('Request hidden from your feed', { icon: '👋' });
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const tabLabel = (tab) => {
    if (tab === 'pending') return t('pending');
    if (tab === 'emergency') return t('emergency');
    if (tab === 'active') return t('active');
    return t('completed');
  };

  return (
    <PortalShell className="pb-20">
      <header className="bg-primary text-white p-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-bold">Volunteer Portal</h1>
          <p className="text-sm text-blue-100">{userData?.name}</p>
        </div>
        <button type="button" onClick={logout} className="text-xl min-h-[48px] min-w-[48px]">
          <FiLogOut />
        </button>
      </header>

      <div className="flex overflow-x-auto bg-white shadow-sm border-b">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`flex-1 min-w-[80px] py-3 text-sm font-semibold min-h-[48px] ${
              activeTab === tab
                ? tab === 'emergency'
                  ? 'text-danger border-b-2 border-danger'
                  : 'text-primary border-b-2 border-primary'
                : 'text-gray-500'
            }`}
            onClick={() => {
              setActiveTab(tab);
              setLoading(true);
            }}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      <main className="p-4 space-y-4 mt-2">
        {loading ? (
          <LoadingSpinner label="Loading feed..." />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={FaInbox}
            title="No requests"
            message={
              activeTab === 'active'
                ? t('no_active_task')
                : 'Nothing to show in this tab right now.'
            }
          />
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className={`bg-white p-5 rounded-2xl shadow-sm border ${
                req.priority === 'emergency' ? 'border-danger' : 'border-gray-100'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <PriorityBadge priority={req.priority} />
                  <span className="text-xs text-blue-600 font-semibold uppercase">
                    {req.type}
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <FaClock className="mr-1" />
                  {getTimeAgo(req.createdAt)}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-1">{req.memberName}</h3>
              <div className="flex items-start text-base text-gray-600 mb-4">
                <FaMapMarkerAlt className="mt-1 mr-2 flex-shrink-0 text-gray-400" />
                <p>{req.memberAddress}</p>
              </div>

              <p className="text-gray-700 mb-4 text-base bg-gray-50 p-3 rounded-lg border">
                {req.description}
              </p>

              {activeTab === 'pending' || activeTab === 'emergency' ? (
                <div className="flex gap-3 mt-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => handleAccept(req)}
                    className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 min-h-[48px] active:scale-95"
                  >
                    <FaCheck /> {t('accept')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(req.id)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 min-h-[48px] active:scale-95"
                  >
                    <FaTimes /> {t('decline')}
                  </button>
                </div>
              ) : activeTab === 'active' ? (
                <button
                  type="button"
                  onClick={() => navigate('/volunteer/active')}
                  className="w-full bg-warning text-white py-3 rounded-lg font-semibold min-h-[48px]"
                >
                  Open Active Task
                </button>
              ) : null}
            </div>
          ))
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-white border-t flex justify-around p-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-10">
        <button
          type="button"
          onClick={() => navigate('/volunteer')}
          className="flex flex-col items-center text-primary min-h-[48px]"
        >
          <FaListUl className="text-2xl" />
          <span className="text-xs font-bold mt-1">{t('feed')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/volunteer/active')}
          className="flex flex-col items-center text-gray-500 relative min-h-[48px]"
        >
          <FaTasks className="text-2xl" />
          {volunteer?.activeTaskId && (
            <span className="absolute top-0 right-1 w-3 h-3 bg-danger rounded-full border-2 border-white" />
          )}
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
