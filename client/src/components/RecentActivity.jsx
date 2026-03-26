import ActivityItem from './ActivityItem';

const RecentActivity = ({ activities = [], loading = false }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Latest system events</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-1" />
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-56" />
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm py-4">No recent activity.</p>
      ) : (
        <ul className="divide-y divide-gray-50 dark:divide-gray-700/50 overflow-y-auto max-h-72">
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              type={activity.type}
              title={activity.title}
              description={activity.description}
              timestamp={activity.timestamp}
              iconColor={activity.iconColor}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentActivity;
