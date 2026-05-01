import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, AlertTriangle, Layers, TrendingUp, Flame, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { formatRelativeTime, getPriorityConfig, getStatusConfig, getInitials, generateAvatarColor } from '../utils/helpers';

const StatCard = ({ icon: Icon, label, value, color, sub, trend }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' };
const STATUS_COLORS = { todo: '#6b7280', 'in-progress': '#3b82f6', done: '#10b981' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          api.get('/tasks/stats/dashboard'),
          api.get('/activities?limit=10')
        ]);
        setStats(statsRes.data);
        setActivities(activitiesRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 card" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 card" />
          <div className="h-64 card" />
        </div>
      </div>
    );
  }

  const priorityChartData = stats?.tasksByPriority?.map(p => ({
    name: p._id ? p._id.charAt(0).toUpperCase() + p._id.slice(1) : 'Unknown',
    value: p.count,
    fill: PRIORITY_COLORS[p._id] || '#6b7280'
  })) || [];

  const userChartData = stats?.tasksPerUser?.slice(0, 6).map(u => ({
    name: u.user?.name?.split(' ')[0] || 'Unknown',
    Total: u.total,
    Done: u.completed,
    Active: u.inProgress
  })) || [];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Here's what's happening across your workspace today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Layers} label="Total Tasks" value={stats?.totalTasks ?? 0} color="bg-brand-600" />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats?.completedTasks ?? 0}
          color="bg-emerald-500"
          sub={`${stats?.completionRate ?? 0}% completion rate`}
        />
        <StatCard icon={Clock} label="In Progress" value={stats?.inProgressTasks ?? 0} color="bg-blue-500" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdueTasks ?? 0} color="bg-red-500" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="High Priority" value={stats?.highPriorityTasks ?? 0} color="bg-orange-500" />
        <StatCard icon={TrendingUp} label="Projects" value={stats?.totalProjects ?? 0} color="bg-violet-500" />
        <div className="col-span-2 card p-5">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Completion Rate</p>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.completionRate ?? 0}%</p>
          </div>
          <div className="mt-3 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-1000"
              style={{ width: `${stats?.completionRate ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{stats?.completedTasks} of {stats?.totalTasks} tasks done</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bar chart: tasks per user */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="section-title mb-4">Tasks per Team Member</h3>
          {userChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={userChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Total" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Done" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Active" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Pie chart: by priority */}
        <div className="card p-5">
          <h3 className="section-title mb-4">By Priority</h3>
          {priorityChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={priorityChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45}>
                  {priorityChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Recent Tasks</h3>
            <Link to="/tasks" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {stats?.recentTasks?.length > 0 ? stats.recentTasks.map(task => {
              const priorityConf = getPriorityConfig(task.priority);
              const statusConf = getStatusConfig(task.status);
              return (
                <div key={task._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${priorityConf.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400">{task.project?.name}</p>
                  </div>
                  <span className={statusConf.badge}>{statusConf.label}</span>
                </div>
              );
            }) : (
              <p className="text-sm text-gray-400 text-center py-6">No tasks yet</p>
            )}
          </div>
        </div>

        {/* Activity feed */}
        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
}
