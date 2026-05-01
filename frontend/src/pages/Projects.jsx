import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, FolderKanban, CheckCircle2, Clock, MoreHorizontal,
  Pencil, Trash2, AlertCircle, Calendar, AlertTriangle, Crown
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/common/Modal';
import { formatDate, getInitials, generateAvatarColor } from '../utils/helpers';

// ─── Constants ───────────────────────────────────────────────────────────────

const PROJECT_COLORS = [
  { hex: '#6366f1', name: 'Indigo' },
  { hex: '#8b5cf6', name: 'Purple' },
  { hex: '#ec4899', name: 'Pink' },
  { hex: '#ef4444', name: 'Red' },
  { hex: '#f97316', name: 'Orange' },
  { hex: '#eab308', name: 'Yellow' },
  { hex: '#22c55e', name: 'Green' },
  { hex: '#06b6d4', name: 'Cyan' },
  { hex: '#0ea5e9', name: 'Sky' },
  { hex: '#64748b', name: 'Slate' },
];

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Active',    dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'on-hold',   label: 'On Hold',   dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'completed', label: 'Completed', dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-600 border-gray-200' },
];

const getStatusConfig = (status) =>
  STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, onDelete, onEdit, isAdmin }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const progress = project.taskCount > 0
    ? Math.round((project.completedCount / project.taskCount) * 100)
    : 0;

  const statusConf = getStatusConfig(project.status);
  const isOverdue = project.isOverdue ||
    (project.dueDate && project.status !== 'completed' && new Date() > new Date(project.dueDate));

  return (
    <div
      className={`
        card-hover p-5 flex flex-col gap-4 relative group
        ${isOverdue ? 'ring-1 ring-red-200' : ''}
      `}
    >
      {/* Overdue banner */}
      {isOverdue && (
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-red-400 to-orange-400" />
      )}

      {/* Color accent strip */}
      <div
        className="absolute top-0 left-5 right-5 h-0.5 rounded-b-full opacity-60"
        style={{ background: project.color || '#6366f1', top: isOverdue ? '2px' : '0' }}
      />

      {/* Header */}
      <div className="flex items-start justify-between pt-1">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
            style={{ background: project.color || '#6366f1' }}
          >
            {project.name[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate max-w-[160px]">
              {project.name}
            </h3>
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1 mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full border ${statusConf.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
              {statusConf.label}
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
              className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7"
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden w-36">
                  <button
                    onClick={(e) => { e.preventDefault(); onEdit(project); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); onDelete(project); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
          {project.description}
        </p>
      )}

      {/* Due date */}
      {project.dueDate && (
        <div className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
          {isOverdue
            ? <AlertTriangle size={12} />
            : <Calendar size={12} />
          }
          {isOverdue ? 'Overdue · ' : 'Due '}
          {formatDate(project.dueDate)}
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{project.completedCount}/{project.taskCount} tasks</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: project.color || '#6366f1' }}
          />
        </div>
      </div>

      {/* Footer: stats + members */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-500" />
            {project.completedCount}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-blue-400" />
            {(project.taskCount || 0) - (project.completedCount || 0)} left
          </span>
          {project.overdueCount > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <AlertCircle size={11} />
              {project.overdueCount}
            </span>
          )}
        </div>

        {/* Member avatars */}
        <div className="flex -space-x-1.5">
          {project.members?.slice(0, 4).map((m, i) => (
            <div
              key={m._id || i}
              className={`w-6 h-6 rounded-md ${generateAvatarColor(m.name)} text-white text-xs flex items-center justify-center font-medium ring-2 ring-white`}
              title={m.name}
            >
              {getInitials(m.name)}
            </div>
          ))}
          {(project.members?.length || 0) > 4 && (
            <div className="w-6 h-6 rounded-md bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-medium ring-2 ring-white">
              +{project.members.length - 4}
            </div>
          )}
        </div>
      </div>

      {/* Clickable overlay — sits below the menu button */}
      <Link to={`/projects/${project._id}`} className="absolute inset-0 rounded-2xl z-0" />
    </div>
  );
}

// ─── Project Form ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  description: '',
  color: '#6366f1',
  members: [],
  status: 'active',
  dueDate: '',
};

function ProjectForm({ initial, users, onSubmit, loading }) {
  const [form, setForm] = useState(() => initial ? {
    name: initial.name || '',
    description: initial.description || '',
    color: initial.color || '#6366f1',
    members: initial.members?.map(m => m._id || m) || [],
    status: initial.status || 'active',
    dueDate: initial.dueDate ? new Date(initial.dueDate).toISOString().split('T')[0] : '',
  } : EMPTY_FORM);

  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));   // clear field error on change
  };

  const toggleMember = (id) =>
    set('members', form.members.includes(id)
      ? form.members.filter(m => m !== id)
      : [...form.members, id]
    );

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Project name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (form.dueDate && isNaN(Date.parse(form.dueDate))) e.dueDate = 'Enter a valid date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, name: form.name.trim(), description: form.description.trim() });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Name */}
      <div>
        <label className="label">Project Name <span className="text-red-400">*</span></label>
        <input
          className={`input ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Website Redesign, Q4 Launch..."
          autoFocus
        />
        {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea
          className="input resize-none leading-relaxed"
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="What is this project about? Goals, scope, context..."
          maxLength={500}
        />
        <p className="text-xs text-gray-400 text-right mt-1">{form.description.length}/500</p>
      </div>

      {/* Color + Status row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Accent Color</label>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_COLORS.map(({ hex, name }) => (
              <button
                key={hex}
                type="button"
                title={name}
                onClick={() => set('color', hex)}
                className="w-7 h-7 rounded-lg transition-all hover:scale-110 focus:outline-none"
                style={{
                  background: hex,
                  transform: form.color === hex ? 'scale(1.25)' : undefined,
                  boxShadow: form.color === hex ? `0 0 0 2px white, 0 0 0 4px ${hex}` : undefined,
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={form.status}
            onChange={e => set('status', e.target.value)}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label className="label">Due Date <span className="text-gray-400 font-normal">(optional)</span></label>
        <div className="relative">
          <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="date"
            className={`input pl-9 ${errors.dueDate ? 'border-red-400 focus:ring-red-400' : ''}`}
            value={form.dueDate}
            onChange={e => set('dueDate', e.target.value)}
            min={today}
          />
        </div>
        {errors.dueDate && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.dueDate}</p>}
      </div>

      {/* Members */}
      <div>
        <label className="label">
          Team Members
          {form.members.length > 0 && (
            <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {form.members.length} selected
            </span>
          )}
        </label>
        {users.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No other users found</p>
        ) : (
          <div className="max-h-44 overflow-y-auto space-y-1 border border-gray-200 rounded-xl p-2">
            {users.map(u => {
              const checked = form.members.includes(u._id);
              return (
                <label
                  key={u._id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${checked ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMember(u._id)}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <div className={`w-7 h-7 rounded-lg ${generateAvatarColor(u.name)} text-white text-xs flex items-center justify-center font-bold shrink-0`}>
                    {getInitials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${u.role === 'admin' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                    {u.role}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview strip */}
      <div
        className="rounded-xl p-3 flex items-center gap-3 border"
        style={{ borderColor: form.color + '40', background: form.color + '08' }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
          style={{ background: form.color }}
        >
          {form.name ? form.name[0].toUpperCase() : '?'}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{form.name || 'Project name'}</p>
          <p className="text-xs text-gray-400">{form.members.length} member{form.members.length !== 1 ? 's' : ''} · {getStatusConfig(form.status).label}</p>
        </div>
        <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusConfig(form.status).badge}`}>
          {getStatusConfig(form.status).label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary flex-1 justify-center py-3" disabled={loading}>
          {loading
            ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
            : (initial ? 'Update Project' : 'Create Project')
          }
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const { isAdmin } = useAuth();

  const fetchAll = async () => {
    try {
      const [pRes, uRes] = await Promise.all([api.get('/projects'), api.get('/users')]);
      setProjects(pRes.data);
      setUsers(uRes.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const { data } = await api.post('/projects', form);
      setProjects(prev => [data, ...prev]);
      setShowCreate(false);
      toast.success(`Project "${data.name}" created!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/projects/${editProject._id}`, form);
      setProjects(prev => prev.map(p => p._id === data._id ? data : p));
      setEditProject(null);
      toast.success('Project updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/projects/${deleteConfirm._id}`);
      setProjects(prev => prev.filter(p => p._id !== deleteConfirm._id));
      setDeleteConfirm(null);
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  // Status filter tabs
  const tabs = [
    { value: 'all', label: 'All', count: projects.length },
    { value: 'active', label: 'Active', count: projects.filter(p => p.status === 'active').length },
    { value: 'on-hold', label: 'On Hold', count: projects.filter(p => p.status === 'on-hold').length },
    { value: 'completed', label: 'Completed', count: projects.filter(p => p.status === 'completed').length },
  ];

  const visible = filterStatus === 'all'
    ? projects
    : projects.filter(p => p.status === filterStatus);

  return (
    <div className="animate-slide-up space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Filter tabs */}
      {projects.length > 0 && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button
              key={t.value}
              onClick={() => setFilterStatus(t.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterStatus === t.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filterStatus === t.value ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-52 card animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-24">
          <FolderKanban size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-500">
            {filterStatus === 'all' ? 'No projects yet' : `No ${filterStatus} projects`}
          </p>
          {isAdmin && filterStatus === 'all' && (
            <p className="text-sm text-gray-400 mt-1">Create your first project to get started</p>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(project => (
            <ProjectCard
              key={project._id}
              project={project}
              isAdmin={isAdmin}
              onEdit={setEditProject}
              onDelete={setDeleteConfirm}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Project" size="md">
        <ProjectForm users={users} onSubmit={handleCreate} loading={saving} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Edit Project" size="md">
        {editProject && (
          <ProjectForm initial={editProject} users={users} onSubmit={handleEdit} loading={saving} />
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Project" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              Deleting <strong>"{deleteConfirm?.name}"</strong> will permanently remove all its tasks and activity logs. This cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1 justify-center" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </button>
            <button className="btn-danger flex-1 justify-center" onClick={handleDelete}>
              Delete Project
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
