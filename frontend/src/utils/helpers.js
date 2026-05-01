import { formatDistanceToNow, format, isPast, isToday, isTomorrow } from 'date-fns';

export const formatRelativeTime = (date) => {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '';
  }
};

export const formatDate = (date) => {
  if (!date) return '';
  try {
    return format(new Date(date), 'MMM d, yyyy');
  } catch {
    return '';
  }
};

export const formatDateInput = (date) => {
  if (!date) return '';
  try {
    return format(new Date(date), 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

export const getDueDateStatus = (dueDate, status) => {
  if (!dueDate || status === 'done') return null;
  const d = new Date(dueDate);
  if (isPast(d)) return 'overdue';
  if (isToday(d)) return 'today';
  if (isTomorrow(d)) return 'tomorrow';
  return 'upcoming';
};

export const getPriorityConfig = (priority) => {
  const configs = {
    high: { label: 'High', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', dot: 'bg-red-500' },
    medium: { label: 'Medium', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500' },
    low: { label: 'Low', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800', dot: 'bg-gray-400' },
  };
  return configs[priority] || configs.medium;
};

export const getStatusConfig = (status) => {
  const configs = {
    todo: { label: 'To Do', badge: 'badge-todo', color: '#6b7280' },
    'in-progress': { label: 'In Progress', badge: 'badge-in-progress', color: '#3b82f6' },
    done: { label: 'Done', badge: 'badge-done', color: '#10b981' },
  };
  return configs[status] || configs.todo;
};

export const getActivityIcon = (type) => {
  const icons = {
    task_created: '✅',
    task_updated: '✏️',
    task_deleted: '🗑️',
    task_moved: '↔️',
    task_assigned: '👤',
    project_created: '📁',
    project_updated: '📝',
    member_added: '➕',
    member_removed: '➖',
  };
  return icons[type] || '📌';
};

export const generateAvatarColor = (name) => {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  ];
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
