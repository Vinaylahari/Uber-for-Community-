import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/firebase';
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { createVolunteerAuthUser } from '../../firebase/adminAuth';
import toast from 'react-hot-toast';
import { FaTrash, FaCheckCircle, FaTimesCircle, FaStar, FaPlus } from 'react-icons/fa';
import LoadingSpinner from '../../components/LoadingSpinner';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  area: '',
  phone: '',
};

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newVol, setNewVol] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'volunteers'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setVolunteers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setListLoading(false);
      },
      () => setListLoading(false)
    );
    return () => unsub();
  }, []);

  const toggleAvailability = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, 'volunteers', id), { isAvailable: !currentStatus });
      toast.success('Availability updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this volunteer from Sahayam? Their login will remain in Firebase Auth until deleted in Console.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'volunteers', id));
      await deleteDoc(doc(db, 'users', id));
      toast.success('Volunteer removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (newVol.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newVol.password !== newVol.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const uid = await createVolunteerAuthUser(newVol.email.trim(), newVol.password);

      await setDoc(doc(db, 'users', uid), {
        uid,
        name: newVol.name.trim(),
        email: newVol.email.trim(),
        phone: newVol.phone.trim(),
        role: 'volunteer',
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'volunteers', uid), {
        uid,
        name: newVol.name.trim(),
        area: newVol.area.trim(),
        isAvailable: true,
        rating: 5.0,
        totalRatings: 0,
        activeTaskId: null,
      });

      toast.success('Volunteer created — they can log in with email and password');
      setShowModal(false);
      setNewVol(emptyForm);
    } catch (error) {
      console.error(error);
      const code = error?.code || '';
      if (code === 'auth/email-already-in-use') {
        toast.error('This email is already registered');
      } else if (code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else {
        toast.error(error?.message || 'Failed to add volunteer');
      }
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Volunteers</h1>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition min-h-[48px]"
        >
          <FaPlus /> Add Volunteer
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {listLoading ? (
          <LoadingSpinner label="Loading volunteers..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Area</th>
                  <th className="p-4 font-semibold">Rating</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-center">Active Task</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {volunteers.map((vol) => (
                  <tr key={vol.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-800">{vol.name || 'Unnamed'}</td>
                    <td className="p-4 text-gray-600">{vol.area || 'N/A'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 font-bold text-gray-700">
                        {(vol.rating || 0).toFixed(1)} <FaStar className="text-warning" />
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => toggleAvailability(vol.id, vol.isAvailable)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold min-h-[36px] ${
                          vol.isAvailable
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {vol.isAvailable ? (
                          <>
                            <FaCheckCircle /> Available
                          </>
                        ) : (
                          <>
                            <FaTimesCircle /> Offline
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      {vol.activeTaskId ? (
                        <span className="bg-warning text-white px-2 py-1 rounded text-xs font-bold">
                          Assigned
                        </span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(vol.id)}
                        className="text-danger hover:text-red-800 p-2 min-h-[48px] min-w-[48px]"
                        title="Remove Volunteer"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
                {volunteers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No volunteers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2">Add New Volunteer</h2>
            <p className="text-sm text-gray-500 mb-4">
              Creates a real Firebase login (admin stays signed in).
            </p>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <input
                  required
                  type="text"
                  value={newVol.name}
                  onChange={(e) => setNewVol({ ...newVol, name: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email (login)</label>
                <input
                  required
                  type="email"
                  value={newVol.email}
                  onChange={(e) => setNewVol({ ...newVol, email: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={newVol.password}
                  onChange={(e) => setNewVol({ ...newVol, password: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Min. 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Confirm password
                </label>
                <input
                  required
                  type="password"
                  value={newVol.confirmPassword}
                  onChange={(e) => setNewVol({ ...newVol, confirmPassword: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  required
                  type="tel"
                  value={newVol.phone}
                  onChange={(e) => setNewVol({ ...newVol, phone: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Area</label>
                <input
                  required
                  type="text"
                  value={newVol.area}
                  onChange={(e) => setNewVol({ ...newVol, area: e.target.value })}
                  placeholder="e.g. Downtown"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border rounded-lg font-semibold text-gray-600 hover:bg-gray-50 min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 min-h-[48px]"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
