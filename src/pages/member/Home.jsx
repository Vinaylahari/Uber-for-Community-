import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import PortalShell from '../../components/PortalShell';
import {
  FaAmbulance,
  FaPills,
  FaShoppingCart,
  FaExclamationTriangle,
  FaListAlt,
  FaUserCircle,
} from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { logout, userData } = useAuth();

  const handleLanguageToggle = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'te' : 'en');
  };

  const navToRequest = (type) => {
    navigate('/member/request', { state: { type } });
  };

  const buttons = [
    {
      type: 'emergency',
      label: t('emergency'),
      icon: FaAmbulance,
      className:
        'bg-danger text-white rounded-2xl p-6 min-h-[120px] flex flex-col items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform',
    },
    {
      type: 'medicine',
      label: t('medicine'),
      icon: FaPills,
      className:
        'bg-white text-primary border-2 border-primary rounded-2xl p-6 min-h-[120px] flex flex-col items-center justify-center gap-3 shadow active:scale-95 transition-transform',
    },
    {
      type: 'grocery',
      label: t('grocery'),
      icon: FaShoppingCart,
      className:
        'bg-white text-primary border-2 border-primary rounded-2xl p-6 min-h-[120px] flex flex-col items-center justify-center gap-3 shadow active:scale-95 transition-transform',
    },
    {
      type: 'complaint',
      label: t('complaint'),
      icon: FaExclamationTriangle,
      className:
        'bg-white text-warning border-2 border-warning rounded-2xl p-6 min-h-[120px] flex flex-col items-center justify-center gap-3 shadow active:scale-95 transition-transform',
    },
    {
      type: null,
      label: t('my_requests'),
      icon: FaListAlt,
      onClick: () => navigate('/member/track'),
      className:
        'bg-white text-gray-800 border-2 border-gray-300 rounded-2xl p-6 min-h-[120px] flex flex-col items-center justify-center gap-3 shadow active:scale-95 transition-transform col-span-1 md:col-span-2',
    },
  ];

  return (
    <PortalShell className="pb-20">
      <header className="bg-primary text-white p-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-2xl font-bold">Sahayam</h1>
          <p className="text-base text-blue-100">
            {t('welcome')}, {userData?.name || 'User'}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            type="button"
            onClick={handleLanguageToggle}
            className="font-bold border px-3 py-2 rounded min-h-[48px] text-base"
          >
            {i18n.language === 'en' ? 'TE' : 'EN'}
          </button>
          <button
            type="button"
            onClick={logout}
            className="text-2xl min-h-[48px] min-w-[48px] flex items-center justify-center"
            aria-label={t('logout')}
          >
            <FiLogOut />
          </button>
        </div>
      </header>

      <main className="p-4 mt-4 grid grid-cols-1 gap-4">
        {buttons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.label}
              type="button"
              onClick={btn.onClick || (() => navToRequest(btn.type))}
              className={btn.className}
            >
              <Icon className="text-4xl" />
              <span className="text-xl font-bold">{btn.label}</span>
            </button>
          );
        })}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-white border-t flex justify-around p-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={() => navigate('/member')}
          className="flex flex-col items-center text-primary min-h-[48px]"
        >
          <FaAmbulance className="text-2xl" />
          <span className="text-sm font-bold mt-1">Home</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/member/track')}
          className="flex flex-col items-center text-gray-500 min-h-[48px]"
        >
          <FaListAlt className="text-2xl" />
          <span className="text-sm font-bold mt-1">{t('my_requests')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/member/profile')}
          className="flex flex-col items-center text-gray-500 min-h-[48px]"
        >
          <FaUserCircle className="text-2xl" />
          <span className="text-sm font-bold mt-1">{t('profile')}</span>
        </button>
      </nav>
    </PortalShell>
  );
}
