import { useState, useEffect } from 'react';
import { Trash2, ShieldAlert, Info } from 'lucide-react';
import Modal from '../common/Modal';
import { formatDateInput, getPriorityConfig, getStatusConfig } from '../../utils/helpers';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = [
  { value: 'todo',        label: 'To Do'      },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done',        label: 'Done'        },
];

// ─── Member: status-only view ────────────────────────────────────────────────

function MemberStatusView({ task, onSave, onClose, loading }) {
  const [status, setStatus] = useState(task?.status || 'todo');

  useEffect(() => { setStatus(task?.status || 'todo'); }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ status });
  };

  const priorityConf = getPriorityConfig(task?.priority);
  const currentStatusConf = getStatusConfig(task?.status);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Read-only task summary */}
      <div className="p-3.5 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug">{task?.title}</h3>
          <span className={`badge shrink-0 ${priorityConf.bg} ${priorityConf.color}`}>
            {priorityConf.label}
          </span>
        </div>
        {task?.description && (
          <p className="text-xs text-gray-500 leading-relaxed">{task.description}</p>
        )}
        {task?.assignedTo && (
          <p className="text-xs text-gray-400">Assigned to: <span className="font-medium text-gray-600">{task.assignedTo.name}</span></p>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
        <ShieldAlert size={15} className="text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-700 leading-relaxed">
          As a <strong>Member</strong>, you can only update the task status. Contact an admin to change other details.
        </p>
      </div>

      {/* Status selector */}
      <div>
        <label className="label">Update Status</label>
        <div className="grid grid-cols-3 gap-2">
          {STATUSES.map(s => {
            const conf = getStatusConfig(s.value);
            const active = status === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={`
                  flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-xs font-medium
                  ${active
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 scale-[1.02]'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${
                  s.value === 'todo' ? 'bg-gray-400' :
                  s.value === 'in-progress' ? 'bg-blue-500' : 'bg-emerald-500'
                }`} />
                {s.label}
              </button>
            );
          })}
        </div>
        {status === task?.status && (
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <Info size={11} /> Current status — select a different one to update
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary flex-1 justify-center"
          disabled={loading || status === task?.status}
        >
          {loading ? 'Saving...' : 'Update Status'}
        </button>
      </div>
    </form>
  );
}

// ─── Admin: full edit form ────────────────────────────────────────────────────

const PRIORITY_STYLES = {
  low:    'bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-300',
  medium: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-300',
  high:   'bg-red-50 text-red-600 border-red-200 hover:border-red-300',
};

function AdminTaskForm({ task, projectId, members, onSave, onDelete, onClose, loading }) {
  const isNew = !task;
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    status: 'todo', dueDate: '', assignedTo: '', tags: '',
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        dueDate: task.dueDate ? formatDateInput(task.dueDate) : '',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        tags: task.tags?.join(', ') || '',
      });
    } else {
      setForm({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', assignedTo: '', tags: '' });
    }
  }, [task]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      ...form,
      dueDate: form.dueDate || null,
      assignedTo: form.assignedTo || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      projectId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Title <span className="text-red-400">*</span></label>
        <input
          className="input text-sm font-medium"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="What needs to be done?"
          required
          autoFocus
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input resize-none"
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Add details or acceptance criteria..."
        />
      </div>

      <div>
        <label className="label">Priority</label>
        <div className="flex gap-2">
          {PRIORITIES.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => set('priority', p)}
              className={`
                flex-1 py-2 rounded-xl text-xs font-semibold border-2 capitalize transition-all
                ${form.priority === p
                  ? PRIORITY_STYLES[p] + ' ring-2 ring-offset-1 ring-current scale-[1.02]'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
                }
              `}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Due Date</label>
          <input
            type="date"
            className="input"
            value={form.dueDate}
            onChange={e => set('dueDate', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Assign To</label>
          <select className="input" value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)}>
            <option value="">Unassigned</option>
            {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Tags <span className="text-gray-400 font-normal">(comma-separated)</span></label>
        <input
          className="input"
          value={form.tags}
          onChange={e => set('tags', e.target.value)}
          placeholder="e.g. frontend, bug, urgent"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        {!isNew && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(task._id)}
            className="p-2.5 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Delete task"
          >
            <Trash2 size={15} />
          </button>
        )}
        <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
          {loading ? 'Saving...' : (isNew ? 'Create Task' : 'Save Changes')}
        </button>
      </div>
    </form>
  );
}

// ─── Exported modal — picks the right form based on role ─────────────────────

export default function TaskModal({
  isOpen, onClose, task, projectId, members = [],
  onSave, onDelete,
  isAdmin = false   // ← caller must pass this
}) {
  const [loading, setLoading] = useState(false);

  const handleSave = async (payload) => {
    setLoading(true);
    try {
      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  const title = isAdmin
    ? (task ? 'Edit Task' : 'Create Task')
    : 'Update Task Status';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {isAdmin ? (
        <AdminTaskForm
          task={task}
          projectId={projectId}
          members={members}
          onSave={handleSave}
          onDelete={onDelete}
          onClose={onClose}
          loading={loading}
        />
      ) : (
        <MemberStatusView
          task={task}
          onSave={handleSave}
          onClose={onClose}
          loading={loading}
        />
      )}
    </Modal>
  );
}
