import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../firebase/firebase';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { FaExclamationCircle, FaCheckCircle, FaSpinner, FaClipboardList, FaBell } from 'react-icons/fa';
import { format, isToday } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState({ today: 0, emergency: 0, pending: 0, completed: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const sortedRecent = useMemo(() => {
    const list = [...recentRequests];
    list.sort((a, b) => {
      let av;
      let bv;
      if (sortKey === 'createdAt') {
        av = a.createdAt?.toDate?.() || new Date(0);
        bv = b.createdAt?.toDate?.() || new Date(0);
      } else if (sortKey === 'priority') {
        const order = { emergency: 3, urgent: 2, normal: 1 };
        av = order[a.priority] || 0;
        bv = order[b.priority] || 0;
      } else {
        av = a.status || '';
        bv = b.status || '';
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [recentRequests, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  useEffect(() => {
    // 1. Live recent requests (last 20)
    const recentQ = query(collection(db, 'requests'), orderBy('createdAt', 'desc'), limit(20));
    const unsubRecent = onSnapshot(recentQ, (snapshot) => {
      const reqs = [];
      snapshot.forEach(d => reqs.push({ id: d.id, ...d.data() }));
      setRecentRequests(reqs);
      
      // Calculate basic stats from recent requests or a wider query if needed. 
      // For MVP, we can derive some stats from the recent snapshot or run aggregate queries.
      // Better approach for stats: listen to all active requests.
    });

    // 2. All requests for stats (simplified for MVP, ideally use Cloud Functions for aggregations)
    const allReqQ = query(collection(db, 'requests'));
    const unsubAll = onSnapshot(allReqQ, (snapshot) => {
      let tDay = 0, emerg = 0, pend = 0, comp = 0;
      const emAlerts = [];
      
      snapshot.forEach(d => {
        const data = d.data();
        if (data.createdAt) {
          const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          if (isToday(date)) tDay++;
        }
        if (data.status === 'pending') pend++;
        if (data.status === 'completed') comp++;
        
        if (data.priority === 'emergency' && data.status !== 'completed' && data.status !== 'cancelled') {
          emerg++;
          emAlerts.push({ id: d.id, ...data });
        }
      });
      
      setStats({ today: tDay, emergency: emerg, pending: pend, completed: comp });
      
      // Sort emergencies by newest
      emAlerts.sort((a, b) => {
        const ad = a.createdAt?.toDate?.() || new Date(0);
        const bd = b.createdAt?.toDate?.() || new Date(0);
        return bd - ad;
      });
      setEmergencies(emAlerts);
    });

    return () => {
      unsubRecent();
      unsubAll();
    };
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Overview</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Requests Today</p>
            <p className="text-3xl font-bold text-gray-800">{stats.today}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-full text-primary">
            <FaClipboardList className="text-2xl" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Active Emergencies</p>
            <p className="text-3xl font-bold text-danger">{stats.emergency}</p>
          </div>
          <div className="bg-red-100 p-4 rounded-full text-danger">
            <FaExclamationCircle className="text-2xl" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Total Pending</p>
            <p className="text-3xl font-bold text-warning">{stats.pending}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-full text-warning">
            <FaSpinner className="text-2xl" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Total Completed</p>
            <p className="text-3xl font-bold text-success">{stats.completed}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-full text-success">
            <FaCheckCircle className="text-2xl" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Requests Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Recent Requests (Latest 20)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Member</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold cursor-pointer" onClick={() => toggleSort('priority')}>
                    Priority {sortKey === 'priority' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="p-4 font-semibold cursor-pointer" onClick={() => toggleSort('status')}>
                    Status {sortKey === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="p-4 font-semibold cursor-pointer" onClick={() => toggleSort('createdAt')}>
                    Date {sortKey === 'createdAt' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {sortedRecent.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{req.memberName}</td>
                    <td className="p-4 capitalize">{req.type}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${req.priority === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {req.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                        req.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                        req.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {req.createdAt ? format(req.createdAt.toDate(), 'MMM dd, HH:mm') : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Emergency Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-danger overflow-hidden h-fit">
          <div className="p-4 bg-danger text-white flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FaBell className="animate-pulse" /> Live Emergencies
            </h2>
            <span className="bg-white text-danger px-2 py-1 rounded-full text-xs font-bold">
              {emergencies.length}
            </span>
          </div>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {emergencies.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No active emergencies. Great!</p>
            ) : (
              emergencies.map(em => (
                <div key={em.id} className="border-l-4 border-danger bg-red-50 p-4 rounded-r-lg shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-gray-800">{em.memberName}</p>
                    <p className="text-xs text-danger font-semibold">
                       {em.createdAt ? format(em.createdAt.toDate(), 'HH:mm') : ''}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2 mb-2">{em.description}</p>
                  <p className="text-xs font-semibold text-gray-500">Status: {em.status}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
