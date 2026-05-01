import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Left – branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-purple-800 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">PulseBoard</span>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Where teams<br />get things done.
            </h1>
            <p className="text-brand-200 mt-4 text-lg leading-relaxed">
              Manage projects, track tasks, and collaborate — all in one beautifully designed workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { n: '10x', label: 'Faster delivery' },
              { n: '100%', label: 'Visibility' },
              { n: 'Real-time', label: 'Collaboration' },
              { n: 'Smart', label: 'Prioritization' },
            ].map(({ n, label }) => (
              <div key={label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">{n}</p>
                <p className="text-sm text-brand-200">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-brand-300 text-sm">PulseBoard — Smart Team Task Manager</p>
      </div>

      {/* Right – form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap size={16} className="text-white fill-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">PulseBoard</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  className="input pl-9"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoFocus
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
                  placeholder="••••••••"
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

            <button type="submit" className="btn-primary w-full justify-center py-3 text-base mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</span>
              ) : (
                <span className="flex items-center gap-2">Sign In <ArrowRight size={16} /></span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              Create one free
            </Link>
          </p>

          {/* Demo hint */}
          <div className="mt-6 p-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Quick start</p>
            <p>Sign up with role <strong>admin</strong> to create projects and manage the full workspace.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
