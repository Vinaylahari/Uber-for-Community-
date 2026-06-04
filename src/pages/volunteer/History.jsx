import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { FaListUl, FaTasks, FaHistory, FaStar, FaMapMarkerAlt, FaCalendarCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function History() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCompleted: 0, averageRating: 0 });

  useEffect(() => {
    if (!currentUser) return;
    
    // Fetch Volunteer Stats
    const fetchStats = async () => {
      try {
        const volSnap = await getDoc(doc(db, 'volunteers', currentUser.uid));
        if (volSnap.exists()) {
          setStats({
            totalCompleted: volSnap.data().totalRatings || 0, // Approx for MVP
            averageRating: volSnap.data().rating || 0
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();

    // Listen to completed requests
    const q = query(
      collection(db, 'requests'), 
      where('assignedVolunteerId', '==', currentUser.uid),
      where('status', '==', 'completed'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqsData = [];
      snapshot.forEach(d => reqsData.push({ id: d.id, ...d.data() }));
      setRequests(reqsData);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error('Failed to load history');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">My History</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto mt-2">
        
        {/* Stats Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-around items-center mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 font-semibold mb-1">Tasks Completed</p>
            <p className="text-3xl font-bold text-primary">{requests.length}</p>
          </div>
          <div className="w-px h-12 bg-gray-200"></div>
          <div className="text-center">
            <p className="text-sm text-gray-500 font-semibold mb-1">Average Rating</p>
            <div className="flex items-center justify-center text-warning text-3xl font-bold">
              {stats.averageRating ? stats.averageRating.toFixed(1) : '-'} <FaStar className="ml-2 text-xl" />
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-800 mb-4">Completed Tasks</h2>

        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading history...</p>
        ) : requests.length === 0 ? (
          <p className="text-center text-gray-500 py-10">You haven't completed any tasks yet.</p>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    {req.type}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold flex items-center">
                    <FaCalendarCheck className="mr-1" />
                    {req.updatedAt ? format(req.updatedAt.toDate(), 'MMM dd, yyyy') : ''}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-800 mb-2">{req.memberName}</h3>
                <div className="flex items-start text-sm text-gray-600 mb-4">
                  <FaMapMarkerAlt className="mt-1 mr-2 flex-shrink-0 text-gray-400" />
                  <p>{req.memberAddress}</p>
                </div>

                {req.rating ? (
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-semibold">Rating Received:</span>
                    <div className="flex text-warning text-lg">
                      {[...Array(req.rating)].map((_, i) => <FaStar key={i} />)}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t">
                    <span className="text-sm text-gray-400 italic">No rating yet</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-3 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-10">
        <button onClick={() => navigate('/volunteer')} className="flex flex-col items-center text-gray-500">
          <FaListUl className="text-2xl" />
          <span className="text-xs font-bold mt-1">Feed</span>
        </button>
        <button onClick={() => navigate('/volunteer/active')} className="flex flex-col items-center text-gray-500">
          <FaTasks className="text-2xl" />
          <span className="text-xs font-bold mt-1">Active</span>
        </button>
        <button onClick={() => navigate('/volunteer/history')} className="flex flex-col items-center text-primary">
          <FaHistory className="text-2xl" />
          <span className="text-xs font-bold mt-1">History</span>
        </button>
      </nav>
    </div>
  );
}
