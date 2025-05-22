// src/components/orders/OrderQR.jsx
import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  Share2, 
  Printer, 
  QrCode,
  Info,
  CheckCircle,
  Package,
  X
} from 'lucide-react';

const OrderQR = ({ order, isOpen, onClose }) => {
  const qrRef = useRef(null);
  const [qrSize, setQrSize] = useState(250);
  const [includeLabel, setIncludeLabel] = useState(true);
  const [message, setMessage] = useState('');

  if (!isOpen || !order) return null;

  const generateOrderQRData = () => {
    const trackingUrl = `${window.location.origin}/track/product/${order.trackingId || order.id}`;
    
    // Return JSON with all order details for richer QR code content
    const orderData = {
      type: 'farm_direct_order',
      url: trackingUrl,
      orderId: order.id,
      trackingId: order.trackingId || order.id.substring(0, 8),
      status: order.status,
      customerName: order.clientName,
      farmerName: order.rolnikName,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      items: order.items || [{
        name: order.productName,
        quantity: order.quantity,
        unit: order.unit,
        price: order.price
      }]
    };
    
    return JSON.stringify(orderData);
  };

  // Download QR code as PNG
  const downloadQR = () => {
    if (!qrRef.current) return;
    
    try {
      const svg = qrRef.current;
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.onload = () => {
        canvas.width = qrSize;
        canvas.height = includeLabel ? qrSize + 80 : qrSize;
        
        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code
        ctx.drawImage(img, 0, 0, qrSize, qrSize);
        
        // Add label text if included
        if (includeLabel) {
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#000000';
          ctx.fillText(`Order #${order.trackingId || order.id.substring(0, 8)}`, canvas.width / 2, qrSize + 25);
          
          ctx.font = '12px Arial';
          ctx.fillText(`Status: ${order.status}`, canvas.width / 2, qrSize + 45);
          ctx.fillText(`From: ${order.rolnikName}`, canvas.width / 2, qrSize + 65);
        }
        
        // Create download link
        const a = document.createElement('a');
        a.download = `order-${order.trackingId || order.id.substring(0, 8)}-qr.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        
        setMessage('QR Code downloaded successfully');
        setTimeout(() => setMessage(''), 3000);
      };
      
      img.src = `data:image/svg+xml;base64,${btoa(svgStr)}`;
    } catch (err) {
      console.error('Error downloading QR code:', err);
      setMessage('Failed to download QR code');
    }
  };

  // Print QR code
  // Print QR code
  const printQR = () => {
    const printWindow = window.open('', '', 'width=800,height=600');

    
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Tracking QR Code</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .qr-container {
            text-align: center;
            margin-bottom: 30px;
          }
          .order-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .tracking-id {
            font-size: 18px;
            margin-bottom: 10px;
          }
          .order-details {
            font-size: 14px;
            margin-bottom: 20px;
            color: #666;
          }
          .instructions {
            font-size: 12px;
            color: #666;
            margin-top: 20px;
            text-align: center;
            max-width: 400px;
            line-height: 1.4;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <div class="order-title">Order Tracking</div>
          <div class="tracking-id">Order #${order.trackingId || order.id.substring(0, 8)}</div>
          <div class="order-details">
            Status: ${order.status} | Total: $${order.totalPrice.toFixed(2)}<br>
            From: ${order.rolnikName}<br>
            Date: ${new Date(order.createdAt).toLocaleDateString()}
          </div>
          
          ${qrRef.current ? qrRef.current.outerHTML : ''}
          
          <div class="instructions">
            <strong>Track Your Order:</strong><br>
            Scan this QR code with your phone camera or QR scanner app to view real-time order status, 
            delivery information, and product details. You can also visit our website and enter 
            tracking code: <strong>${order.trackingId || order.id.substring(0, 8)}</strong>
          </div>
        </div>
        
        <div class="no-print" style="margin-top: 30px;">
          <button onclick="window.print()" style="margin-right: 10px; padding: 10px 20px; font-size: 14px;">Print</button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px;">Close</button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
  };

  // Share QR code
  const shareQR = async () => {
    if (!navigator.share) {
      // Fallback - copy tracking URL to clipboard
      try {
        await navigator.clipboard.writeText(generateOrderQRData());
        setMessage('Tracking link copied to clipboard');
        setTimeout(() => setMessage(''), 3000);
      } catch {
        setMessage('Sharing not supported');
      }
      return;
    }
    
    try {
      await navigator.share({
        title: `Order Tracking #${order.trackingId || order.id.substring(0, 8)}`,
        text: `Track your Farm Direct order from ${order.rolnikName}`,
        url: generateOrderQRData()
      });
      
      setMessage('Order tracking shared successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Order Tracking QR Code</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Order #{order.trackingId || order.id.substring(0, 8)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
              {message}
            </div>
          )}
          
          <div className="flex flex-col items-center mb-6">
            <div 
              className="bg-white p-6 rounded-lg shadow-sm border" 
              style={{ maxWidth: `${qrSize + 40}px` }}
            >
              {/* Hidden SVG for reference when downloading/printing */}
              <div className="hidden">
                <QRCodeSVG
                  ref={qrRef}
                  value={generateOrderQRData()}
                  size={qrSize}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              {/* Visible QR code */}
              <QRCodeSVG
                value={generateOrderQRData()}
                size={qrSize}
                level="H"
                includeMargin={true}
              />
              
              {includeLabel && (
                <div className="text-center mt-3">
                  <p className="font-bold">Order #{order.trackingId || order.id.substring(0, 8)}</p>
                  <p className="text-sm text-gray-600">Status: {order.status}</p>
                  <p className="text-sm text-gray-600">From: {order.rolnikName}</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Button 
                variant="outline" 
                className="flex items-center gap-2" 
                onClick={downloadQR}
              >
                <Download size={16} />
                Download
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={printQR}
              >
                <Printer size={16} />
                Print
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={shareQR}
              >
                <Share2 size={16} />
                Share
              </Button>
            </div>
            
            <div className="flex items-center mt-4 space-x-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="includeOrderLabel" 
                  checked={includeLabel} 
                  onChange={() => setIncludeLabel(!includeLabel)}
                  className="w-4 h-4"
                />
                <label htmlFor="includeOrderLabel" className="text-sm">Include order info</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <label htmlFor="orderQrSize" className="text-sm">Size:</label>
                <select 
                  id="orderQrSize" 
                  value={qrSize} 
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  className="text-sm border rounded p-1"
                >
                  <option value={150}>Small</option>
                  <option value={250}>Medium</option>
                  <option value={350}>Large</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex items-start">
              <Info className="text-blue-500 flex-shrink-0 mt-0.5 mr-3" size={20} />
              <div>
                <h3 className="font-medium text-blue-700">How customers use this QR code</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-blue-700">
                  <li>Scan with phone camera or QR app to track order status</li>
                  <li>View real-time delivery updates and timeline</li>
                  <li>Access product and farmer information</li>
                  <li>No app download required - works in any browser</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderQR;