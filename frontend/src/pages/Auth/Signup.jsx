import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.role);
      toast.success('Account created! Welcome to PulseBoard 🚀');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Left */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-purple-700 via-brand-700 to-brand-600 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">PulseBoard</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Build your<br />dream team today.
            </h1>
            <p className="text-brand-200 mt-4 text-lg">
              Organize work, track progress, and ship faster with your team.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '🧠', title: 'Smart task prioritization', desc: 'AI-assisted priority scoring' },
              { icon: '📊', title: 'Visual dashboards', desc: 'Real-time metrics & charts' },
              { icon: '🔔', title: 'Activity tracking', desc: 'Know what\'s happening live' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-brand-200">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-brand-300 text-sm">Free to get started — no credit card required</p>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap size={16} className="text-white fill-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">PulseBoard</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Join your team on PulseBoard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-9"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="John Doe"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  className="input pl-9"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Role</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'member', label: 'Member', icon: User, desc: 'Work on tasks' },
                  { value: 'admin', label: 'Admin', icon: Shield, desc: 'Manage workspace' },
                ].map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => set('role', r.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm transition-all ${
                      form.role === r.value
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <r.icon size={18} />
                    <span className="font-medium">{r.label}</span>
                    <span className="text-xs text-gray-400">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3 text-base mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</span>
              ) : (
                <span className="flex items-center gap-2">Create Account <ArrowRight size={16} /></span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
