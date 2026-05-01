import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, CheckCircle2, Clock, AlertTriangle,
  Plus, X, Search, UserCheck, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskModal from '../components/tasks/TaskModal';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { getInitials, generateAvatarColor } from '../utils/helpers';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState({ open: false, task: null, defaultStatus: 'todo' });
  const [filters, setFilters] = useState({ priority: '', assignedTo: '', search: '' });
  // Members default to "my tasks" view; admins see all
  const [myTasksOnly, setMyTasksOnly] = useState(!isAdmin);
  const [tab, setTab] = useState('board');

  const fetchAll = async () => {
    try {
      const [projRes, tasksRes, actRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
        api.get(`/activities?projectId=${id}&limit=20`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setActivities(actRes.data);
    } catch {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
      if (filters.search) params.set('search', filters.search);
      const { data } = await api.get(`/tasks/project/${id}?${params}`);
      setTasks(data);
    } catch { /* silent */ }
  };

  useEffect(() => { if (!loading) fetchTasks(); }, [filters]);

  // ── Effective tasks: apply "my tasks" toggle on top of server filters ──
  const visibleTasks = myTasksOnly
    ? tasks.filter(t => t.assignedTo?._id === user?.id || t.assignedTo === user?.id)
    : tasks;

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleTaskMove = async (taskId, newStatus) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      const actRes = await api.get(`/activities?projectId=${id}&limit=20`);
      setActivities(actRes.data);
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'ADMIN_REQUIRED' || code === 'STATUS_ONLY') {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to update task');
      }
      fetchTasks(); // revert optimistic update
    }
  };

  const handleSaveTask = async (form) => {
    try {
      if (taskModal.task) {
        const { data } = await api.put(`/tasks/${taskModal.task._id}`, form);
        setTasks(prev => prev.map(t => t._id === data._id ? data : t));
        toast.success(isAdmin ? 'Task updated!' : 'Status updated!');
      } else {
        const { data } = await api.post('/tasks', {
          ...form,
          status: taskModal.defaultStatus,
          projectId: id
        });
        setTasks(prev => [...prev, data]);
        toast.success('Task created!');
      }
      setTaskModal({ open: false, task: null, defaultStatus: 'todo' });
      const actRes = await api.get(`/activities?projectId=${id}&limit=20`);
      setActivities(actRes.data);
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'ADMIN_REQUIRED') toast.error('Only admins can perform this action.');
      else if (code === 'STATUS_ONLY') toast.error('You can only update task status.');
      else toast.error(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      setTaskModal({ open: false, task: null, defaultStatus: 'todo' });
      toast.success('Task deleted');
    } catch (err) {
      const code = err.response?.data?.code;
      toast.error(code === 'ADMIN_REQUIRED' ? 'Only admins can delete tasks.' : 'Failed to delete task');
    }
  };

  const openTask = (task) =>
    setTaskModal({ open: true, task, defaultStatus: task.status });

  const openAddTask = (status) => {
    if (!isAdmin) return; // belt-and-suspenders: button is hidden, but guard anyway
    setTaskModal({ open: true, task: null, defaultStatus: status });
  };

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-xl" />
        <div className="h-36 card" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-80 card" />)}
        </div>
      </div>
    );
  }

  const todoCount       = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const doneCount       = tasks.filter(t => t.status === 'done').length;
  const overdueCount    = tasks.filter(t => t.isOverdue).length;
  const progress        = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
  const myAssigned      = tasks.filter(t => t.assignedTo?._id === user?.id || t.assignedTo === user?.id).length;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Back */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Projects
      </button>

      {/* ── Project header card ─────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0"
            style={{ background: project?.color || '#6366f1' }}
          >
            {project?.name?.[0]?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{project?.name}</h1>
                  {/* Role badge */}
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    isAdmin
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {isAdmin
                      ? <><ShieldCheck size={11} /> Admin</>
                      : <><UserCheck size={11} /> Member</>
                    }
                  </span>
                </div>
                {project?.description && (
                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                )}
              </div>

              {/* Only admins see "Add Task" */}
              {isAdmin && (
                <button
                  className="btn-primary shrink-0"
                  onClick={() => openAddTask('todo')}
                >
                  <Plus size={15} /> Add Task
                </button>
              )}
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{doneCount}/{tasks.length} completed</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, background: project?.color || '#6366f1' }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1.5 text-gray-500">
                <div className="w-2 h-2 rounded-full bg-gray-400" />{todoCount} Todo
              </span>
              <span className="flex items-center gap-1.5 text-blue-500">
                <div className="w-2 h-2 rounded-full bg-blue-400" />{inProgressCount} In Progress
              </span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />{doneCount} Done
              </span>
              {overdueCount > 0 && (
                <span className="flex items-center gap-1.5 text-red-500">
                  <AlertTriangle size={14} />{overdueCount} Overdue
                </span>
              )}
              {!isAdmin && (
                <span className="flex items-center gap-1.5 text-indigo-500 ml-auto">
                  <UserCheck size={13} />{myAssigned} assigned to me
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <Users size={14} className="text-gray-400" />
          <div className="flex items-center gap-1.5 flex-wrap">
            {project?.members?.map(m => (
              <div
                key={m._id}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  m._id === user?.id
                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                    : 'bg-gray-50 text-gray-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-md ${generateAvatarColor(m.name)} text-white text-xs flex items-center justify-center font-bold`}>
                  {getInitials(m.name)}
                </div>
                {m.name}
                {m._id === user?.id && <span className="text-indigo-400">(you)</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters + My Tasks toggle ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* My Tasks toggle — always visible */}
        <button
          onClick={() => setMyTasksOnly(!myTasksOnly)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
            myTasksOnly
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          <UserCheck size={14} />
          {myTasksOnly ? 'My Tasks' : 'All Tasks'}
        </button>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <Search size={14} className="text-gray-400" />
          <input
            placeholder="Search tasks..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="bg-transparent focus:outline-none text-gray-700 placeholder-gray-400 w-36"
          />
        </div>

        <select
          value={filters.priority}
          onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {isAdmin && (
          <select
            value={filters.assignedTo}
            onChange={e => setFilters(f => ({ ...f, assignedTo: e.target.value }))}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Members</option>
            {project?.members?.map(m => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        )}

        {(filters.priority || filters.assignedTo || filters.search) && (
          <button
            onClick={() => setFilters({ priority: '', assignedTo: '', search: '' })}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {['board', 'activity'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {tab === 'board' ? (
        <>
          {/* Member hint */}
          {!isAdmin && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
              <UserCheck size={15} className="shrink-0" />
              <span>
                <strong>Member view:</strong> drag tasks between columns to update their status.
                Contact an admin to create, edit, or delete tasks.
              </span>
            </div>
          )}
          <KanbanBoard
            tasks={visibleTasks}
            isAdmin={isAdmin}
            onTaskClick={openTask}
            onAddTask={openAddTask}
            onTaskMove={handleTaskMove}
          />
        </>
      ) : (
        <div className="card p-5">
          <ActivityFeed activities={activities} compact />
        </div>
      )}

      {/* ── Task Modal ────────────────────────────────────────────────────── */}
      <TaskModal
        isOpen={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null, defaultStatus: 'todo' })}
        task={taskModal.task}
        projectId={id}
        members={project?.members || []}
        onSave={handleSaveTask}
        onDelete={isAdmin ? handleDeleteTask : null}
        isAdmin={isAdmin}
      />
    </div>
  );
}
