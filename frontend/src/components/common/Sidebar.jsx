import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, User, LogOut, Zap, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'All Tasks', icon: CheckSquare },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar, theme, toggleTheme } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside
      className={`
        relative flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
        transition-all duration-300 ease-in-out shrink-0 z-30
        ${sidebarOpen ? 'w-64' : 'w-16'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-gray-800">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
          <Zap size={16} className="text-white fill-white" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">PulseBoard</span>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-16 mt-4 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
      >
        {sidebarOpen
          ? <ChevronLeft size={12} className="text-gray-500" />
          : <ChevronRight size={12} className="text-gray-500" />
        }
      </button>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-0' : ''}`
            }
            title={!sidebarOpen ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {sidebarOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`sidebar-link w-full ${!sidebarOpen ? 'justify-center px-0' : ''}`}
          title={!sidebarOpen ? 'Toggle theme' : undefined}
        >
          {theme === 'dark'
            ? <Sun size={18} className="shrink-0 text-amber-500" />
            : <Moon size={18} className="shrink-0" />
          }
          {sidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 ${!sidebarOpen ? 'justify-center px-0' : ''}`}
          title={!sidebarOpen ? 'Logout' : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {sidebarOpen && <span>Logout</span>}
        </button>

        {/* User info */}
        {sidebarOpen && user && (
          <div className="flex items-center gap-3 px-3 py-2 mt-2 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
