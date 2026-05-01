import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import useStore from '../../store/useStore';

export default function Layout() {
  const { sidebarOpen } = useStore();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-0' : 'ml-0'}`}>
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
