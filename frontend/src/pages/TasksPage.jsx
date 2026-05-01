import { useState, useEffect } from 'react';
import { CheckSquare, Search, X, Flame, AlertTriangle, Calendar, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { getPriorityConfig, getStatusConfig, formatDate, getInitials, generateAvatarColor } from '../utils/helpers';
import TaskModal from '../components/tasks/TaskModal';

export default function TasksPage() {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [taskModal, setTaskModal] = useState({ open: false, task: null });
  const [projects, setProjects] = useState([]);
  const [myTasksOnly, setMyTasksOnly] = useState(!isAdmin);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.search) params.set('search', filters.search);
      const [tasksRes, projRes] = await Promise.all([
        api.get(`/tasks?${params}`),
        api.get('/projects')
      ]);
      setTasks(tasksRes.data);
      setProjects(projRes.data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [filters]);

  const handleSaveTask = async (form) => {
    if (!taskModal.task) return;
    try {
      const { data } = await api.put(`/tasks/${taskModal.task._id}`, form);
      setTasks(prev => prev.map(t => t._id === data._id ? data : t));
      setTaskModal({ open: false, task: null });
      toast.success(isAdmin ? 'Task updated!' : 'Status updated!');
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'STATUS_ONLY') toast.error('You can only update task status.');
      else toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      setTaskModal({ open: false, task: null });
      toast.success('Task deleted');
    } catch (err) {
      const code = err.response?.data?.code;
      toast.error(code === 'ADMIN_REQUIRED' ? 'Only admins can delete tasks.' : 'Failed to delete task');
    }
  };

  // Apply "my tasks" filter client-side on top of server results
  const filteredTasks = myTasksOnly
    ? tasks.filter(t => t.assignedTo?._id === user?.id || t.assignedTo === user?.id)
    : tasks;

  const grouped = {
    overdue: filteredTasks.filter(t => t.isOverdue),
    high:    filteredTasks.filter(t => t.priority === 'high' && !t.isOverdue && t.status !== 'done'),
    active:  filteredTasks.filter(t => !t.isOverdue && t.priority !== 'high' && t.status !== 'done'),
    done:    filteredTasks.filter(t => t.status === 'done')
  };

  const TaskRow = ({ task }) => {
    const priorityConf = getPriorityConfig(task.priority);
    const statusConf = getStatusConfig(task.status);

    return (
      <tr
        className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
        onClick={() => setTaskModal({ open: true, task })}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full shrink-0 ${priorityConf.dot}`} />
            <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
              {task.title}
            </span>
            {task.isOverdue && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
          </div>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          {task.project && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: task.project.color || '#6366f1' }} />
              <span className="text-xs text-gray-500">{task.project.name}</span>
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={statusConf.badge}>{statusConf.label}</span>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          <span className={`badge ${priorityConf.bg} ${priorityConf.color}`}>
            {task.priority === 'high' && <Flame size={10} />}
            {priorityConf.label}
          </span>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell">
          {task.dueDate ? (
            <span className={`flex items-center gap-1 text-xs ${task.isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
              <Calendar size={11} />
              {formatDate(task.dueDate)}
            </span>
          ) : <span className="text-xs text-gray-300">—</span>}
        </td>
        <td className="px-4 py-3">
          {task.assignedTo ? (
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-md ${generateAvatarColor(task.assignedTo.name)} text-white text-xs flex items-center justify-center font-medium`}>
                {getInitials(task.assignedTo.name)}
              </div>
              <span className="text-xs text-gray-500 hidden xl:inline">{task.assignedTo.name}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </td>
      </tr>
    );
  };

  const currentTask = taskModal.task;
  const currentProject = projects.find(p => p._id === (currentTask?.project?._id || currentTask?.project));

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            {myTasksOnly ? ' assigned to you' : ' total'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* My Tasks toggle */}
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
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            placeholder="Search tasks..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="bg-transparent focus:outline-none text-gray-700 placeholder-gray-400 w-40"
          />
        </div>
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
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
        {(filters.status || filters.priority || filters.search) && (
          <button
            onClick={() => setFilters({ status: '', priority: '', search: '' })}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="card animate-pulse h-64" />
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-24">
          <CheckSquare size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-500">No tasks found</p>
          <p className="text-sm text-gray-400 mt-1">Tasks from your projects will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overdue section */}
          {grouped.overdue.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">Overdue ({grouped.overdue.length})</span>
              </div>
              <table className="w-full">
                <tbody>{grouped.overdue.map(t => <TaskRow key={t._id} task={t} />)}</tbody>
              </table>
            </div>
          )}

          {/* High priority */}
          {grouped.high.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-orange-50 dark:bg-orange-900/10 border-b border-orange-100 dark:border-orange-900/30 flex items-center gap-2">
                <Flame size={14} className="text-orange-500" />
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">High Priority ({grouped.high.length})</span>
              </div>
              <table className="w-full">
                <tbody>{grouped.high.map(t => <TaskRow key={t._id} task={t} />)}</tbody>
              </table>
            </div>
          )}

          {/* Active tasks */}
          {grouped.active.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active ({grouped.active.length})</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-50 dark:border-gray-800">
                    <th className="px-4 py-2 font-medium">Task</th>
                    <th className="px-4 py-2 font-medium hidden md:table-cell">Project</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium hidden sm:table-cell">Priority</th>
                    <th className="px-4 py-2 font-medium hidden lg:table-cell">Due</th>
                    <th className="px-4 py-2 font-medium">Assignee</th>
                  </tr>
                </thead>
                <tbody>{grouped.active.map(t => <TaskRow key={t._id} task={t} />)}</tbody>
              </table>
            </div>
          )}

          {/* Done */}
          {grouped.done.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2">
                <CheckSquare size={14} className="text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Completed ({grouped.done.length})</span>
              </div>
              <table className="w-full">
                <tbody>{grouped.done.map(t => <TaskRow key={t._id} task={t} />)}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Task Modal */}
      <TaskModal
        isOpen={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null })}
        task={taskModal.task}
        projectId={currentTask?.project?._id || currentTask?.project}
        members={currentProject?.members || []}
        onSave={handleSaveTask}
        onDelete={isAdmin ? handleDeleteTask : null}
        isAdmin={isAdmin}
      />
    </div>
  );
}
