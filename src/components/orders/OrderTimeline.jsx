import { ORDER_STATUSES } from '@/firebase/orders';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  CheckCircle, 
  Clock, 
  Package, 
  Truck, 
  XCircle, 
  ShoppingCart,
  ClipboardCheck,
  AlertCircle
} from 'lucide-react';

const getStatusIcon = (status) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-5 w-5" />;
    case 'confirmed':
      return <ClipboardCheck className="h-5 w-5" />;
    case 'preparing':
      return <Package className="h-5 w-5" />;
    case 'ready':
      return <ShoppingCart className="h-5 w-5" />;
    case 'in_transit':
      return <Truck className="h-5 w-5" />;
    case 'delivered':
    case 'completed':
      return <CheckCircle className="h-5 w-5" />;
    case 'cancelled':
      return <XCircle className="h-5 w-5" />;
    default:
      return <AlertCircle className="h-5 w-5" />;
  }
};

const getStatusColor = (status) => {
  const statusInfo = ORDER_STATUSES[status] || { color: 'gray' };
  
  switch (statusInfo.color) {
    case 'green':
      return 'text-green-500 bg-green-100 border-green-200';
    case 'blue':
      return 'text-blue-500 bg-blue-100 border-blue-200';
    case 'yellow':
      return 'text-yellow-500 bg-yellow-100 border-yellow-200';
    case 'purple':
      return 'text-purple-500 bg-purple-100 border-purple-200';
    case 'red':
      return 'text-red-500 bg-red-100 border-red-200';
    default:
      return 'text-gray-500 bg-gray-100 border-gray-200';
  }
};

const OrderTimeline = ({ statusHistory = [] }) => {
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No status history available
      </div>
    );
  }
  
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {statusHistory.map((statusEntry, index) => {
          const isLast = index === statusHistory.length - 1;
          const statusInfo = ORDER_STATUSES[statusEntry.status] || {
            label: 'Unknown',
            description: 'Unknown status',
            color: 'gray'
          };
          const colorClasses = getStatusColor(statusEntry.status);
          
          return (
            <li key={index}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div>
                    <div className={`relative p-2 rounded-full flex items-center justify-center ${colorClasses}`}>
                      {getStatusIcon(statusEntry.status)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {statusInfo.label}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {format(new Date(statusEntry.timestamp), 'PPPp')}
                        {' '}
                        ({formatDistanceToNow(new Date(statusEntry.timestamp), { addSuffix: true })})
                      </p>
                    </div>
                    {statusEntry.note && (
                      <div className="mt-2 text-sm text-gray-700">
                        {statusEntry.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default OrderTimeline;