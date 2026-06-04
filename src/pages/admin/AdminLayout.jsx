import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaTachometerAlt, FaUsers, FaListAlt, FaChartBar, FaSignOutAlt } from 'react-icons/fa';

export default function AdminLayout() {
  const { logout, userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <FaTachometerAlt />, end: true },
    { name: 'Volunteers', path: '/admin/volunteers', icon: <FaUsers />, end: false },
    { name: 'Requests', path: '/admin/requests', icon: <FaListAlt />, end: false },
    { name: 'Reports', path: '/admin/reports', icon: <FaChartBar />, end: false },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex flex-col hidden md:flex fixed h-full z-10">
        <div className="p-6 text-center border-b border-blue-800">
          <h1 className="text-3xl font-bold">Sahayam</h1>
          <p className="text-sm text-blue-200 mt-1">Admin Portal</p>
        </div>
        
        <nav className="flex-1 mt-6">
          <ul className="space-y-2 px-4">
            {navItems.map(item => (
              <li key={item.name}>
                <NavLink 
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) => 
                    `flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-800 text-white font-bold' : 'text-blue-100 hover:bg-blue-800 hover:text-white'}`
                  }
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-blue-800">
          <div className="flex items-center mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center font-bold mr-3">
              {userData?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="font-semibold text-sm">{userData?.name || 'Admin'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full p-3 text-blue-100 hover:bg-danger hover:text-white rounded-lg transition-colors"
          >
            <FaSignOutAlt className="mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 bg-gray-100 min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-primary text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-20">
          <h1 className="text-xl font-bold">Sahayam Admin</h1>
          <button onClick={handleLogout}><FaSignOutAlt className="text-xl" /></button>
        </header>

        {/* Mobile Nav (simple bottom nav for MVP or rely on desktop) */}
        <nav className="md:hidden fixed bottom-0 w-full bg-white border-t flex justify-around p-3 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
           {navItems.map(item => (
              <NavLink 
                key={item.name}
                to={item.path}
                end={item.end}
                className={({ isActive }) => 
                  `flex flex-col items-center p-2 rounded-lg ${isActive ? 'text-primary' : 'text-gray-500'}`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] mt-1 font-semibold">{item.name}</span>
              </NavLink>
            ))}
        </nav>

        {/* Page Content */}
        <div className="p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
