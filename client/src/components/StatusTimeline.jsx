import { useMemo } from 'react';

const STATUS_STEPS = ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const StatusTimeline = ({ currentStatus, statusHistory = [] }) => {
  const historyMap = useMemo(() => {
    const map = {};
    statusHistory.forEach((h) => {
      map[h.status] = new Date(h.updatedAt);
    });
    return map;
  }, [statusHistory]);

  const currentIndex = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="relative">
      {STATUS_STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const timestamp = historyMap[step];
        const displayTime = timestamp
          ? timestamp.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '';

        return (
          <div key={step} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isCompleted
                    ? isCurrent
                      ? 'bg-primary animate-pulse-slow ring-4 ring-primary/30'
                      : 'bg-accent'
                    : 'bg-gray-200'
                }`}
              >
                {isCompleted ? (
                  <svg
                    className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-white'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-gray-400 font-medium">{index + 1}</span>
                )}
              </div>
              {index < STATUS_STEPS.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-[40px] ${
                    isCompleted ? 'bg-accent' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
            <div className="pb-8">
              <p
                className={`font-medium ${
                  isCurrent ? 'text-primary' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {step}
              </p>
              {displayTime && (
                <p className="text-sm text-gray-500 mt-1">{displayTime}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
