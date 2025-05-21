import { ORDER_STATUSES } from '@/firebase/orders';
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
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: 'text-green-500'
      };
    case 'blue':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        icon: 'text-blue-500'
      };
    case 'yellow':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        icon: 'text-yellow-500'
      };
    case 'purple':
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-200',
        icon: 'text-purple-500'
      };
    case 'red':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: 'text-red-500'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
        icon: 'text-gray-500'
      };
  }
};

const OrderStatus = ({ status, size = 'medium', showLabel = true, showDescription = false }) => {
  const statusInfo = ORDER_STATUSES[status] || {
    label: 'Unknown',
    description: 'Unknown status',
    color: 'gray'
  };
  
  const colorClasses = getStatusColor(status);
  
  // Size classes
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };
  
  if (size === 'badge') {
    return (
      <span 
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses.bg} ${colorClasses.text}`}
      >
        <span className={`mr-1 ${colorClasses.icon}`}>
          {getStatusIcon(status)}
        </span>
        {statusInfo.label}
      </span>
    );
  }
  
  return (
    <div className={`inline-flex items-center rounded-md ${colorClasses.bg} ${sizeClasses[size] || sizeClasses.medium}`}>
      <span className={`mr-1.5 ${colorClasses.icon}`}>
        {getStatusIcon(status)}
      </span>
      <span className="font-medium">
        {showLabel && statusInfo.label}
        {showDescription && showLabel && ': '}
        {showDescription && (
          <span className="font-normal">{statusInfo.description}</span>
        )}
      </span>
    </div>
  );
};

export default OrderStatus;