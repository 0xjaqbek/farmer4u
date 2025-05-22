// First, let's update the OrderStatus component with better error handling and debugging

import { useState } from 'react';
import { ORDER_STATUSES } from '@/firebase/orders';
import { 
  CheckCircle, 
  Clock, 
  Package, 
  Truck, 
  XCircle, 
  ShoppingCart, 
  ClipboardCheck, 
  AlertCircle,
  Info,
  ChevronRight,
  Loader2
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const getStatusIcon = (status) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'confirmed':
      return <ClipboardCheck className="h-4 w-4" />;
    case 'preparing':
      return <Package className="h-4 w-4" />;
    case 'ready':
      return <ShoppingCart className="h-4 w-4" />;
    case 'in_transit':
      return <Truck className="h-4 w-4" />;
    case 'delivered':
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
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
        hover: 'hover:bg-green-200'
      };
    case 'blue':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-200'
      };
    case 'yellow':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        hover: 'hover:bg-yellow-200'
      };
    case 'purple':
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-200'
      };
    case 'red':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        hover: 'hover:bg-red-200'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-200'
      };
  }
};

const getNextStatuses = (currentStatus) => {
  const statusFlow = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['in_transit', 'delivered', 'completed', 'cancelled'],
    in_transit: ['delivered', 'cancelled'],
    delivered: ['completed'],
    completed: [],
    cancelled: []
  };
  
  return statusFlow[currentStatus] || [];
};

const StatusProgressBar = ({ currentStatus }) => {
  const progressOrder = ['pending', 'confirmed', 'preparing', 'ready', 'in_transit', 'delivered', 'completed'];
  const currentIndex = progressOrder.indexOf(currentStatus);
  
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center space-x-2 text-red-600">
        <XCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Order Cancelled</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Order Progress</span>
        <span>{Math.round(((currentIndex + 1) / progressOrder.length) * 100)}%</span>
      </div>
      <div className="flex space-x-1">
        {progressOrder.map((status, index) => (
          <div
            key={status}
            className={`h-2 flex-1 rounded-full ${
              index <= currentIndex 
                ? 'bg-green-500' 
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const OrderStatus = ({ 
  status, 
  size = 'medium', 
  showLabel = true, 
  showDescription = false,
  clickable = true,
  onStatusChange,
  canChangeStatus = false,
  orderId,
  statusHistory = [],
  userRole = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  
  const statusInfo = ORDER_STATUSES[status] || {
    label: 'Unknown',
    description: 'Unknown status',
    color: 'gray'
  };
  
  const colorClasses = getStatusColor(status);
  const nextStatuses = getNextStatuses(status);
  
  // Debug logging
  console.log('OrderStatus Debug:', {
    status,
    canChangeStatus,
    userRole,
    orderId,
    nextStatuses,
    onStatusChange: !!onStatusChange
  });
  
  // Size classes
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  const handleStatusUpdate = async (newStatus) => {
    console.log('Attempting to update status to:', newStatus);
    
    if (!onStatusChange) {
      console.error('No onStatusChange handler provided');
      setError('Status update handler not available');
      return;
    }
    
    if (!canChangeStatus) {
      console.error('User does not have permission to change status');
      setError('You do not have permission to change this order status');
      return;
    }
    
    try {
      setUpdating(true);
      setError('');
      
      console.log('Calling onStatusChange with:', newStatus);
      await onStatusChange(newStatus);
      
      console.log('Status update successful');
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      setError(`Failed to update status: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Simple badge version (non-clickable)
  if (size === 'badge' || !clickable) {
    return (
      <span 
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses.bg} ${colorClasses.text}`}
      >
        <span className="mr-1">
          {getStatusIcon(status)}
        </span>
        {statusInfo.label}
      </span>
    );
  }

  // Enhanced clickable version
  const StatusContent = () => (
    <div 
      className={`inline-flex items-center rounded-md cursor-pointer transition-colors ${colorClasses.bg} ${colorClasses.text} ${colorClasses.hover} ${sizeClasses[size] || sizeClasses.medium}`}
    >
      <span className="mr-1.5">
        {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : getStatusIcon(status)}
      </span>
      <span className="font-medium">
        {showLabel && statusInfo.label}
        {showDescription && showLabel && ': '}
        {showDescription && (
          <span className="font-normal">{statusInfo.description}</span>
        )}
      </span>
      {clickable && (
        <ChevronRight className="ml-1 h-3 w-3" />
      )}
    </div>
  );

  if (!clickable) {
    return <StatusContent />;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div>
          <StatusContent />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status)}
              <h4 className="font-semibold">{statusInfo.label}</h4>
            </div>
            <p className="text-sm text-gray-600">{statusInfo.description}</p>
          </div>

          {/* Progress Bar */}
          <StatusProgressBar currentStatus={status} />

          {/* Status History Preview */}
          {statusHistory && statusHistory.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Recent Updates</h5>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {statusHistory.slice(-3).reverse().map((entry, index) => (
                  <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {ORDER_STATUSES[entry.status]?.label || entry.status}
                      </span>
                      <span className="text-gray-500">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="text-gray-600 mt-1">{entry.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions for Status Change */}
          {canChangeStatus && nextStatuses.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Quick Actions</h5>
              <div className="space-y-1">
                {nextStatuses.map(nextStatus => {
                  const nextStatusInfo = ORDER_STATUSES[nextStatus];
                  return (
                    <Button
                      key={nextStatus}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleStatusUpdate(nextStatus)}
                      disabled={updating}
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        getStatusIcon(nextStatus)
                      )}
                      <span className="ml-2">Mark as {nextStatusInfo.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status Details */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <p className="font-medium">What this status means:</p>
                <p>{statusInfo.description}</p>
                {status === 'pending' && (
                  <p className="mt-1">The farmer needs to confirm your order.</p>
                )}
                {status === 'confirmed' && (
                  <p className="mt-1">Your order has been accepted and will be prepared.</p>
                )}
                {status === 'preparing' && (
                  <p className="mt-1">The farmer is currently preparing your order.</p>
                )}
                {status === 'ready' && (
                  <p className="mt-1">Your order is ready for pickup or delivery.</p>
                )}
                {status === 'in_transit' && (
                  <p className="mt-1">Your order is on the way to you.</p>
                )}
                {status === 'delivered' && (
                  <p className="mt-1">Your order has been delivered successfully.</p>
                )}
                {status === 'completed' && (
                  <p className="mt-1">The order process is complete. Thank you!</p>
                )}
                {status === 'cancelled' && (
                  <p className="mt-1">This order has been cancelled.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default OrderStatus;