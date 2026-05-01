import { Calendar, User, Flame, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDate, getPriorityConfig, getDueDateStatus, getInitials, generateAvatarColor } from '../../utils/helpers';

const DueDateBadge = ({ dueDate, status }) => {
  const dueDateStatus = getDueDateStatus(dueDate, status);
  if (!dueDate || !dueDateStatus) return null;

  const styles = {
    overdue: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    today: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    tomorrow: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    upcoming: 'text-gray-500 bg-gray-50 dark:bg-gray-800'
  };

  const icons = {
    overdue: AlertTriangle,
    today: Clock,
    tomorrow: Clock,
    upcoming: Calendar
  };

  const Icon = icons[dueDateStatus];

  return (
    <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md font-medium ${styles[dueDateStatus]}`}>
      <Icon size={11} />
      {dueDateStatus === 'overdue' ? 'Overdue' : formatDate(dueDate)}
    </span>
  );
};

export default function TaskCard({ task, onClick, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task._id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const priorityConf = getPriorityConfig(task.priority);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={`
        bg-white dark:bg-gray-900 rounded-xl border p-3.5 cursor-grab active:cursor-grabbing
        group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-150
        ${task.isOverdue ? 'border-red-200 dark:border-red-900/50' : 'border-gray-100 dark:border-gray-800'}
        ${task.priority === 'high' ? 'border-l-4 border-l-red-400' : ''}
        ${isSortableDragging ? 'shadow-modal z-50' : ''}
      `}
    >
      {/* Priority + Overdue indicators */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`badge ${priorityConf.bg} ${priorityConf.color} text-xs`}>
          {task.priority === 'high' && <Flame size={10} className="shrink-0" />}
          {priorityConf.label}
        </span>
        {task.status === 'done' && <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />}
      </div>

      {/* Title */}
      <p className={`text-sm font-medium leading-snug mb-2 ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
        {task.title}
      </p>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-3">{task.description}</p>
      )}

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        <DueDateBadge dueDate={task.dueDate} status={task.status} />
        {task.assignedTo ? (
          <div
            className={`w-6 h-6 rounded-md ${generateAvatarColor(task.assignedTo.name)} text-white text-xs flex items-center justify-center font-medium`}
            title={task.assignedTo.name}
          >
            {getInitials(task.assignedTo.name)}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <User size={12} className="text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}
