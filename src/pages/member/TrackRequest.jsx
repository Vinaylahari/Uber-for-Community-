import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
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
} from 'firebase/firestore';
import {
  FaArrowLeft,
  FaStar,
  FaPhoneAlt,
  FaCheckCircle,
  FaMotorcycle,
  FaBoxOpen,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import PortalShell from '../../components/PortalShell';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PriorityBadge from '../../components/PriorityBadge';

export default function TrackRequest() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [volunteerPhones, setVolunteerPhones] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return undefined;

    const q = query(
      collection(db, 'requests'),
      where('memberId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const reqs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRequests(reqs);

        const phones = {};
        for (const req of reqs) {
          if (req.assignedVolunteerId && !phones[req.assignedVolunteerId]) {
            const userSnap = await getDoc(doc(db, 'users', req.assignedVolunteerId));
            if (userSnap.exists()) {
              phones[req.assignedVolunteerId] = userSnap.data().phone || '';
            }
          }
        }
        setVolunteerPhones(phones);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error('Failed to load requests');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleRate = async (reqId, volunteerId, ratingValue) => {
    try {
      await updateDoc(doc(db, 'requests', reqId), { rating: ratingValue });

      if (volunteerId) {
        const volRef = doc(db, 'volunteers', volunteerId);
        const volSnap = await getDoc(volRef);
        if (volSnap.exists()) {
          const volData = volSnap.data();
          const oldTotal = volData.totalRatings || 0;
          const oldRating = volData.rating || 5;
          const newTotal = oldTotal + 1;
          const newRating = (oldRating * oldTotal + ratingValue) / newTotal;

          await updateDoc(volRef, {
            rating: newRating,
            totalRatings: newTotal,
          });
        }
      }
      toast.success('Thank you for rating!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit rating.');
    }
  };

  const getProgressWidth = (status) => {
    switch (status) {
      case 'pending':
        return '25%';
      case 'accepted':
        return '50%';
      case 'on_the_way':
        return '75%';
      case 'completed':
        return '100%';
      default:
        return '0%';
    }
  };

  return (
    <PortalShell className="pb-20">
      <div className="flex items-center mb-6 pt-4 px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 mr-2 bg-gray-200 rounded-full active:scale-95 min-h-[48px] min-w-[48px] flex items-center justify-center"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">{t('my_requests')}</h1>
      </div>

      <div className="px-4">
        {loading ? (
          <LoadingSpinner />
        ) : requests.length === 0 ? (
          <EmptyState icon={FaBoxOpen} title="No requests" message={t('no_requests')} />
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold uppercase mb-2">
                      {req.type}
                    </span>
                    <h3 className="font-semibold text-lg text-gray-800">{req.description}</h3>
                  </div>
                  <PriorityBadge priority={req.priority} />
                </div>

                <div className="mt-4 mb-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        req.status === 'completed' ? 'bg-success' : 'bg-primary'
                      }`}
                      style={{ width: getProgressWidth(req.status) }}
                    />
                  </div>
                  <div className="flex justify-between text-sm mt-1 text-gray-500 font-medium">
                    <span>Pending</span>
                    <span>Accepted</span>
                    <span>On Way</span>
                    <span>Done</span>
                  </div>
                </div>

                {req.assignedVolunteerId && req.status !== 'pending' && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">{t('assigned_volunteer')}</p>
                    <p className="font-semibold text-lg">{req.assignedVolunteerName}</p>
                    {volunteerPhones[req.assignedVolunteerId] && (
                      <a
                        href={`tel:${volunteerPhones[req.assignedVolunteerId]}`}
                        className="inline-flex items-center gap-2 mt-2 text-primary font-semibold min-h-[48px]"
                      >
                        <FaPhoneAlt /> {volunteerPhones[req.assignedVolunteerId]}
                      </a>
                    )}
                  </div>
                )}

                {req.status === 'completed' && !req.rating && (
                  <div className="mt-4 pt-4 border-t text-center">
                    <p className="text-base font-semibold mb-2">{t('rate_volunteer')}</p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            handleRate(req.id, req.assignedVolunteerId, star)
                          }
                          className="text-3xl text-gray-300 hover:text-warning min-h-[48px] min-w-[48px]"
                        >
                          <FaStar />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {req.rating && (
                  <div className="mt-4 pt-4 border-t flex items-center gap-2">
                    <span className="text-sm text-gray-500">Your Rating:</span>
                    <div className="flex text-warning">
                      {[...Array(req.rating)].map((_, i) => (
                        <FaStar key={i} />
                      ))}
                    </div>
                  </div>
                )}

                {req.status === 'on_the_way' && (
                  <p className="mt-3 text-warning font-semibold flex items-center gap-2 text-base">
                    <FaMotorcycle /> Volunteer is on the way
                  </p>
                )}
                {req.status === 'accepted' && (
                  <p className="mt-3 text-primary font-semibold flex items-center gap-2 text-base">
                    <FaCheckCircle /> Volunteer accepted your request
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
