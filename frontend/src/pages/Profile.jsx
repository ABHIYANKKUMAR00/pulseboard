import { useState, useEffect } from 'react';
import { User, Mail, Shield, TrendingUp, CheckCircle2, Clock, AlertTriangle, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { getInitials, generateAvatarColor, formatDate } from '../utils/helpers';

function ScoreBar({ score }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Productivity Score</span>
        <span className="font-bold text-gray-900 dark:text-gray-100">{score}/100</span>
      </div>
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-gray-400">
        {score >= 70 ? '🚀 Excellent! Keep it up!' : score >= 40 ? '👍 Good progress, keep going!' : '💪 Room to grow — complete more tasks!'}
      </p>
    </div>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '' });
  const [saving, setSaving] = useState(false);
  const [scores, setScores] = useState([]);
  const [myScore, setMyScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const { data } = await api.get('/users/productivity');
        setScores(data);
        const mine = data.find(s => s.user.id === user?.id || s.user._id === user?.id);
        setMyScore(mine);
      } catch {
        console.error('Failed to load scores');
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, [user?.id]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', form);
      updateUser(data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-slide-up">
      <h1 className="page-title">Profile</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="card p-6 flex flex-col items-center text-center gap-4">
          <div className={`w-20 h-20 rounded-2xl ${generateAvatarColor(user?.name)} text-white text-2xl font-bold flex items-center justify-center`}>
            {getInitials(user?.name)}
          </div>

          {editing ? (
            <div className="w-full space-y-3">
              <input
                className="input text-center"
                value={form.name}
                onChange={e => setForm({ name: e.target.value })}
                placeholder="Your name"
              />
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 justify-center text-xs" onClick={() => setEditing(false)}>
                  <X size={14} /> Cancel
                </button>
                <button className="btn-primary flex-1 justify-center text-xs" onClick={handleSave} disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user?.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
              <button className="btn-secondary text-sm" onClick={() => setEditing(true)}>
                <Edit2 size={14} /> Edit Name
              </button>
            </>
          )}

          <div className="w-full border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Mail size={14} className="text-gray-400 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Shield size={14} className="text-gray-400 shrink-0" />
              <span className="capitalize">{user?.role}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock size={14} className="text-gray-400 shrink-0" />
              <span>Joined {formatDate(user?.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* My stats */}
        <div className="md:col-span-2 space-y-4">
          <div className="card p-5">
            <h3 className="section-title mb-4">My Performance</h3>
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-xl w-full" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-full" />
              </div>
            ) : (
              <ScoreBar score={myScore?.score ?? user?.productivity_score ?? 0} />
            )}

            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { icon: CheckCircle2, label: 'Completed', value: myScore?.completedTasks ?? 0, color: 'text-emerald-500' },
                { icon: Clock, label: 'In Progress', value: myScore?.inProgressTasks ?? 0, color: 'text-blue-500' },
                { icon: AlertTriangle, label: 'Overdue', value: myScore?.overdueTasks ?? 0, color: 'text-red-500' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <Icon size={18} className={`${color} mx-auto mb-1`} />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-brand-500" />
          <h3 className="section-title">Team Productivity Leaderboard</h3>
        </div>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {scores.map((s, idx) => (
              <div
                key={s.user.id || s.user._id}
                className={`flex items-center gap-4 p-3.5 rounded-xl transition-colors ${
                  (s.user.id === user?.id || s.user._id === user?.id)
                    ? 'bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-200 dark:ring-brand-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {/* Rank */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                  idx === 1 ? 'bg-gray-100 text-gray-600' :
                  idx === 2 ? 'bg-orange-100 text-orange-600' :
                  'bg-gray-50 dark:bg-gray-800 text-gray-400'
                }`}>
                  {idx + 1}
                </div>

                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg ${generateAvatarColor(s.user.name)} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                  {getInitials(s.user.name)}
                </div>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${(s.user.id === user?.id || s.user._id === user?.id) ? 'text-brand-700 dark:text-brand-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {s.user.name} {(s.user.id === user?.id || s.user._id === user?.id) && '(you)'}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{s.score}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.score >= 70 ? 'bg-emerald-500' : s.score >= 40 ? 'bg-amber-500' : 'bg-red-400'}`}
                      style={{ width: `${s.score}%`, transition: 'width 1s ease' }}
                    />
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span>{s.completedTasks} done</span>
                    <span>{s.totalTasks} total</span>
                    {s.overdueTasks > 0 && <span className="text-red-400">{s.overdueTasks} overdue</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
