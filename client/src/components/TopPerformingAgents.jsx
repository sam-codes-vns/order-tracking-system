import AgentRankItem from './AgentRankItem';

const TopPerformingAgents = ({ agents = [], loading = false }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top Performing Agents</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Based on completed orders this month</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1" />
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12" />
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm py-4">No agent data available.</p>
      ) : (
        <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {agents.map((agent) => (
            <AgentRankItem
              key={agent.id}
              rank={agent.rank}
              name={agent.name}
              completedOrders={agent.completedOrders}
              rating={agent.rating}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopPerformingAgents;
