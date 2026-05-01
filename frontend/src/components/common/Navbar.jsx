import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/tasks': 'All Tasks',
  '/profile': 'Profile',
};

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState('');

  const getTitle = () => {
    if (location.pathname.startsWith('/projects/')) return 'Project Board';
    return pageTitles[location.pathname] || 'PulseBoard';
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{getTitle()}</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 w-56">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none w-full"
          />
        </div>

        {/* Notification bell placeholder */}
        <button className="btn-icon relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
