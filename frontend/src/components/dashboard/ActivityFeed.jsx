import { getActivityIcon, formatRelativeTime, getInitials, generateAvatarColor } from '../../utils/helpers';

export default function ActivityFeed({ activities = [], compact = false }) {
  return (
    <div className={compact ? '' : 'card p-5'}>
      {!compact && <h3 className="section-title mb-4">Activity Feed</h3>}
      <div className="space-y-3">
        {activities.length > 0 ? activities.map(activity => (
          <div key={activity._id} className="flex items-start gap-3 group">
            {/* User avatar */}
            <div className={`w-7 h-7 rounded-lg ${generateAvatarColor(activity.user?.name)} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}>
              {getInitials(activity.user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                <span className="font-medium">{activity.user?.name}</span>
                {' '}
                <span className="text-gray-500 dark:text-gray-400">
                  {activity.action.replace(activity.user?.name, '').trim()}
                </span>
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">{formatRelativeTime(activity.createdAt)}</span>
                {activity.project?.name && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    · <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: activity.project.color || '#6366f1' }}
                    />
                    {activity.project.name}
                  </span>
                )}
              </div>
            </div>
            <span className="text-base shrink-0 mt-0.5">{getActivityIcon(activity.type)}</span>
          </div>
        )) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No activity yet</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Actions will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
