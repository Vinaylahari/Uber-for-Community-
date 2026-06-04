import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Reports() {
  const [typeData, setTypeData] = useState([]);
  const [dayData, setDayData] = useState([]);
  const [topVolunteers, setTopVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqSnap, volSnap] = await Promise.all([
          getDocs(collection(db, 'requests')),
          getDocs(collection(db, 'volunteers')),
        ]);

        const requests = reqSnap.docs.map((d) => d.data());
        const volunteers = volSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const typeCount = { emergency: 0, medicine: 0, grocery: 0, complaint: 0, other: 0 };
        requests.forEach((r) => {
          if (typeCount[r.type] !== undefined) typeCount[r.type]++;
          else typeCount.other++;
        });
        setTypeData(
          Object.keys(typeCount).map((key) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            Requests: typeCount[key],
          }))
        );

        const daysMap = {};
        for (let i = 29; i >= 0; i--) {
          const day = startOfDay(subDays(new Date(), i));
          daysMap[format(day, 'MMM dd')] = 0;
        }
        requests.forEach((r) => {
          if (!r.createdAt) return;
          const date = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
          const key = format(date, 'MMM dd');
          if (daysMap[key] !== undefined) daysMap[key]++;
        });
        setDayData(Object.keys(daysMap).map((name) => ({ name, Requests: daysMap[name] })));

        const completedByVol = {};
        requests
          .filter((r) => r.status === 'completed' && r.assignedVolunteerId)
          .forEach((r) => {
            completedByVol[r.assignedVolunteerId] =
              (completedByVol[r.assignedVolunteerId] || 0) + 1;
          });

        const leaderboard = volunteers
          .map((v) => ({
            ...v,
            completedCount: completedByVol[v.id] || v.totalRatings || 0,
          }))
          .sort((a, b) => {
            if (b.rating !== a.rating) return (b.rating || 0) - (a.rating || 0);
            return b.completedCount - a.completedCount;
          })
          .slice(0, 5);

        setTopVolunteers(leaderboard);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching report data', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading reports..." />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports & Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Requests by Type</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
                <YAxis tick={{ fill: '#6B7280' }} />
                <Tooltip />
                <Bar dataKey="Requests" fill="#1D4ED8" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Requests per Day (Last 30 Days)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: '#6B7280' }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="Requests"
                  stroke="#16A34A"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Top 5 Volunteers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase">
                <th className="p-4 font-semibold">Rank</th>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Area</th>
                <th className="p-4 font-semibold text-center">Rating</th>
                <th className="p-4 font-semibold text-center">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {topVolunteers.map((vol, index) => (
                <tr key={vol.id || index}>
                  <td className="p-4 font-bold text-gray-500">#{index + 1}</td>
                  <td className="p-4 font-bold">{vol.name}</td>
                  <td className="p-4 text-gray-600">{vol.area}</td>
                  <td className="p-4 text-center font-bold">
                    {vol.rating ? vol.rating.toFixed(1) : 'N/A'} ⭐
                  </td>
                  <td className="p-4 text-center">{vol.completedCount}</td>
                </tr>
              ))}
              {topVolunteers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No volunteers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
