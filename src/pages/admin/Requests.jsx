import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, getDocs, where } from 'firebase/firestore';
import { FaTimesCircle, FaUserEdit, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [filteredReqs, setFilteredReqs] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [fType, setFType] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [fPriority, setFPriority] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Reassign Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [selectedVol, setSelectedVol] = useState('');

  useEffect(() => {
    // Listen to all requests
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const reqs = [];
      snapshot.forEach(d => reqs.push({ id: d.id, ...d.data() }));
      setRequests(reqs);
      setLoading(false);
    });

    // Fetch volunteers once for the reassignment dropdown
    const fetchVols = async () => {
      const vSnap = await getDocs(query(collection(db, 'volunteers'), where('isAvailable', '==', true)));
      const vData = [];
      vSnap.forEach(d => vData.push({ id: d.id, ...d.data() }));
      setVolunteers(vData);
    };
    fetchVols();

    return () => unsub();
  }, []);

  useEffect(() => {
    let result = requests;
    if (fType !== 'all') result = result.filter(r => r.type === fType);
    if (fStatus !== 'all') result = result.filter(r => r.status === fStatus);
    if (fPriority !== 'all') result = result.filter(r => r.priority === fPriority);
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((r) => {
        const d = r.createdAt?.toDate?.() || new Date(r.createdAt);
        return d >= from;
      });
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((r) => {
        const d = r.createdAt?.toDate?.() || new Date(r.createdAt);
        return d <= to;
      });
    }
    setFilteredReqs(result);
  }, [requests, fType, fStatus, fPriority, dateFrom, dateTo]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    try {
      await updateDoc(doc(db, 'requests', id), {
        status: 'cancelled',
        updatedAt: new Date()
      });
      // Need to clear volunteer's activeTask if it was assigned, handled in a robust backend. 
      // For MVP client side, we might have edge cases here.
      toast.success('Request cancelled');
    } catch (e) {
      toast.error('Failed to cancel');
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVol) return;
    
    try {
      const volInfo = volunteers.find(v => v.id === selectedVol);
      if (!volInfo) return;

      // 1. Free old volunteer if any
      if (selectedReq.assignedVolunteerId) {
        await updateDoc(doc(db, 'volunteers', selectedReq.assignedVolunteerId), { activeTaskId: null });
      }

      // 2. Assign new volunteer
      await updateDoc(doc(db, 'requests', selectedReq.id), {
        assignedVolunteerId: volInfo.id,
        assignedVolunteerName: volInfo.name || 'Volunteer',
        status: 'accepted',
        updatedAt: new Date()
      });

      // 3. Update new volunteer doc
      await updateDoc(doc(db, 'volunteers', volInfo.id), {
        activeTaskId: selectedReq.id
      });

      toast.success('Volunteer assigned successfully!');
      setShowModal(false);
      setSelectedReq(null);
      setSelectedVol('');
    } catch (e) {
      console.error(e);
      toast.error('Failed to reassign');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Requests</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FaSearch className="text-gray-400" />
          <span className="font-semibold text-gray-700">Filters:</span>
        </div>
        <select value={fType} onChange={e=>setFType(e.target.value)} className="p-2 border rounded-lg outline-none bg-gray-50 text-sm">
          <option value="all">All Types</option>
          <option value="emergency">Emergency</option>
          <option value="medicine">Medicine</option>
          <option value="grocery">Grocery</option>
          <option value="complaint">Complaint</option>
          <option value="other">Other</option>
        </select>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} className="p-2 border rounded-lg outline-none bg-gray-50 text-sm">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="on_the_way">On The Way</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={fPriority} onChange={e=>setFPriority(e.target.value)} className="p-2 border rounded-lg outline-none bg-gray-50 text-sm">
          <option value="all">All Priorities</option>
          <option value="emergency">Emergency</option>
          <option value="urgent">Urgent</option>
          <option value="normal">Normal</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="p-2 border rounded-lg bg-gray-50 text-sm" aria-label="From date" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="p-2 border rounded-lg bg-gray-50 text-sm" aria-label="To date" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Date & Member</th>
                <th className="p-4 font-semibold">Details</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Volunteer</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : filteredReqs.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No requests match the filters.</td></tr>
              ) : (
                filteredReqs.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{req.memberName}</div>
                      <div className="text-xs text-gray-500">
                        {req.createdAt ? format(req.createdAt.toDate(), 'MMM dd, HH:mm') : ''}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">{req.type}</span>
                        {req.priority === 'emergency' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700">SOS</span>
                        )}
                      </div>
                      <div className="text-gray-600 line-clamp-1 max-w-xs" title={req.description}>{req.description}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                        req.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                        req.status === 'cancelled' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-700">
                      {req.assignedVolunteerName || <span className="text-gray-400 font-normal">Unassigned</span>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {req.status !== 'completed' && req.status !== 'cancelled' && (
                          <>
                            <button 
                              onClick={() => { setSelectedReq(req); setShowModal(true); }}
                              className="text-primary hover:text-blue-800 p-2 bg-blue-50 rounded"
                              title="Assign/Reassign"
                            >
                              <FaUserEdit />
                            </button>
                            <button 
                              onClick={() => handleCancel(req.id)}
                              className="text-danger hover:text-red-800 p-2 bg-red-50 rounded"
                              title="Cancel Request"
                            >
                              <FaTimesCircle />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reassign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2">Assign Volunteer</h2>
            <p className="text-sm text-gray-500 mb-4">Select an available volunteer for {selectedReq?.memberName}'s request.</p>
            
            <form onSubmit={handleReassignSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Available Volunteers</label>
                <select 
                  required
                  value={selectedVol} 
                  onChange={e => setSelectedVol(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-gray-50"
                >
                  <option value="">-- Select a Volunteer --</option>
                  {volunteers.map(v => (
                    <option key={v.id} value={v.id} disabled={v.activeTaskId && v.activeTaskId !== selectedReq.id}>
                      {v.name} ({v.area}) {v.activeTaskId ? '- Busy' : ''} - ⭐{(v.rating||0).toFixed(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border rounded-lg font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
