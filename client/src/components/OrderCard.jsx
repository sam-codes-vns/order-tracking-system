import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  Placed: 'bg-blue-100 text-blue-800',
  Packed: 'bg-indigo-100 text-indigo-800',
  Shipped: 'bg-purple-100 text-purple-800',
  'Out for Delivery': 'bg-amber-100 text-amber-800',
  Delivered: 'bg-green-100 text-green-800'
};

const OrderCard = ({ order }) => {
  const itemsSummary = order.items
    .map((i) => `${i.name} (${i.qty})`)
    .join(', ');
  const statusColor = STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800';
  const isDelivered = order.status === 'Delivered';
  const date = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden animate-fade-in">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-mono text-gray-500">
            #{order._id.slice(-8).toUpperCase()}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
            {order.status}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2" title={itemsSummary}>
          {itemsSummary}
        </p>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-primary">${order.totalAmount?.toFixed(2)}</span>
          <span className="text-xs text-gray-400">{date}</span>
        </div>
        {!isDelivered && (
          <Link
            to={`/track/${order._id}`}
            className="mt-4 block w-full text-center bg-primary hover:bg-primary-dark text-white py-2 rounded-md text-sm font-medium transition-colors"
          >
            Track Order
          </Link>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
