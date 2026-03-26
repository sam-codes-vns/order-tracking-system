const getRelativeTime = (timestamp) => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec <= 0) return 'just now';
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
  return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
};

const ActivityIcon = ({ type, iconColor }) => {
  const colorClass = iconColor || 'text-gray-500';

  const icons = {
    delivered: (
      <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    created: (
      <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    registered: (
      <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    delayed: (
      <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    maintenance: (
      <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  const bgColors = {
    delivered: 'bg-green-100 dark:bg-green-900/30',
    created: 'bg-blue-100 dark:bg-blue-900/30',
    registered: 'bg-purple-100 dark:bg-purple-900/30',
    delayed: 'bg-yellow-100 dark:bg-yellow-900/30',
    maintenance: 'bg-red-100 dark:bg-red-900/30',
  };

  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${bgColors[type] || 'bg-gray-100 dark:bg-gray-700'}`}>
      {icons[type] || icons.created}
    </div>
  );
};

const ActivityItem = ({ type, title, description, timestamp, iconColor }) => {
  return (
    <li className="flex items-start gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 px-2 rounded-lg transition-colors">
      <ActivityIcon type={type} iconColor={iconColor} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap mt-0.5">
        {getRelativeTime(timestamp)}
      </span>
    </li>
  );
};

export default ActivityItem;
