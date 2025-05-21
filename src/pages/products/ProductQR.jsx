import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../../firebase/products.jsx';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Printer, 
  QrCode,
  Info,
  CheckCircle
} from 'lucide-react';

const ProductQR = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qrRef = useRef(null);
  const [product, setProduct] = useState(null);
  const [qrSize, setQrSize] = useState(250);
  const [includeLabel, setIncludeLabel] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [qrDownloaded, setQrDownloaded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(id);
        console.log('Fetched product:', productData);
        
        setProduct(productData);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Function to generate QR data for this product
  const generateQRData = () => {
    if (!product) return '';
    
    // Create a data object to encode in the QR code
    const qrData = {
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      rolnikId: product.rolnikId,
      rolnikName: product.rolnikName,
      organic: product.isOrganic || false,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(qrData);
  };

  // Download QR code as PNG
  const downloadQR = () => {
    if (!qrRef.current) return;
    
    try {
      // Convert the SVG to a canvas element
      const svg = qrRef.current;
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Create an image from the SVG data
      const img = new Image();
      img.onload = () => {
        // Set canvas size
        canvas.width = qrSize;
        canvas.height = includeLabel ? qrSize + 50 : qrSize;
        
        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code
        ctx.drawImage(img, 0, 0, qrSize, qrSize);
        
        // Add label text if included
        if (includeLabel && product) {
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#000000';
          ctx.fillText(product.name, canvas.width / 2, qrSize + 20);
          
          ctx.font = '12px Arial';
          ctx.fillText(`$${product.price.toFixed(2)} / ${product.unit}`, canvas.width / 2, qrSize + 40);
        }
        
        // Create download link
        const a = document.createElement('a');
        a.download = `${product.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        
        setQrDownloaded(true);
        setMessage('QR Code downloaded successfully');
        setTimeout(() => setMessage(''), 3000);
      };
      
      img.src = `data:image/svg+xml;base64,${btoa(svgStr)}`;
    } catch (err) {
      console.error('Error downloading QR code:', err);
      setError('Failed to download QR code. Please try again.');
    }
  };

  // Print QR code
  const printQR = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print QR Code - ${product?.name || 'Product'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .qr-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 30px;
          }
          .product-name {
            font-size: 18px;
            font-weight: bold;
            margin: 10px 0 5px;
          }
          .product-price {
            font-size: 14px;
            margin-bottom: 5px;
          }
          .farm-name {
            font-size: 12px;
            color: #666;
          }
          .print-info {
            font-size: 10px;
            color: #999;
            margin-top: 40px;
            text-align: center;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <h1 class="no-print">Print Preview</h1>
        <div class="qr-container">
          ${qrRef.current.outerHTML}
          <div class="product-name">${product?.name || 'Product'}</div>
          <div class="product-price">$${product?.price?.toFixed(2) || '0.00'} / ${product?.unit || 'unit'}</div>
          <div class="farm-name">By: ${product?.rolnikName || 'Farmer'}</div>
        </div>
        <div class="print-info">
          Farm Direct - Scan this QR code to view product details
        </div>
        <button class="no-print" onclick="window.print()">Print</button>
        <button class="no-print" onclick="window.close()">Close</button>
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
      setError('Sharing is not supported on this browser');
      return;
    }
    
    try {
      // Create a blob from the SVG
      const svg = qrRef.current;
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml' });
      
      // Convert to file
      const file = new File([svgBlob], `${product.name.replace(/\s+/g, '-').toLowerCase()}-qr.svg`, { 
        type: 'image/svg+xml' 
      });
      
      await navigator.share({
        title: `QR Code for ${product.name}`,
        text: `Scan this QR code to view details for ${product.name}`,
        files: [file]
      });
      
      setMessage('QR Code shared successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error sharing QR code:', err);
      if (err.name !== 'AbortError') {
        setError('Failed to share QR code. Please try downloading instead.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/products/manage')}
          className="mr-2"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-bold">Product QR Code</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-700">{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>QR Code for {product?.name}</CardTitle>
            <CardDescription>
              Customers can scan this code to verify product details
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div 
              className="bg-white p-6 rounded-lg shadow-sm border" 
              style={{ maxWidth: `${qrSize + 40}px` }}
            >
              {/* Hidden SVG for reference when downloading/printing */}
              <div className="hidden">
                <QRCodeSVG
                  ref={qrRef}
                  value={generateQRData()}
                  size={qrSize}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              {/* Visible QR code */}
              <QRCodeSVG
                value={generateQRData()}
                size={qrSize}
                level="H"
                includeMargin={true}
              />
              
              {includeLabel && (
                <div className="text-center mt-3">
                  <p className="font-bold">{product?.name}</p>
                  <p className="text-sm">${product?.price?.toFixed(2)} / {product?.unit}</p>
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
              
              {navigator.share && (
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={shareQR}
                >
                  <Share2 size={16} />
                  Share
                </Button>
              )}
            </div>
            
            <div className="flex items-center mt-4 space-x-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="includeLabel" 
                  checked={includeLabel} 
                  onChange={() => setIncludeLabel(!includeLabel)}
                  className="w-4 h-4"
                />
                <label htmlFor="includeLabel" className="text-sm">Include product label</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <label htmlFor="qrSize" className="text-sm">Size:</label>
                <select 
                  id="qrSize" 
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code Information</CardTitle>
            <CardDescription>
              How to use your product QR code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="mt-1 text-green-500 flex-shrink-0">
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 className="font-medium">What's in this QR code?</h3>
                  <p className="text-sm text-gray-600">
                    This QR code contains essential product details including name, price, 
                    unit, your farm information, and a unique product identifier.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="mt-1 text-green-500 flex-shrink-0">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Product Authenticity</h3>
                  <p className="text-sm text-gray-600">
                    Customers can scan this code to verify the product comes directly from your farm 
                    and view its details, enhancing trust in your products.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="mt-1 text-green-500 flex-shrink-0">
                  <Printer size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Printing Recommendations</h3>
                  <p className="text-sm text-gray-600">
                    Print QR codes on waterproof labels for outdoor use. Ensure they're at least 1 inch 
                    (2.5cm) in size for easy scanning. Test before mass printing.
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md mt-6">
                <div className="flex items-start">
                  <Info className="text-blue-500 flex-shrink-0 mt-0.5 mr-3" size={20} />
                  <div>
                    <h3 className="font-medium text-blue-700">Where to use your QR code</h3>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-blue-700">
                      <li>Product packaging and labels</li>
                      <li>Price tags and display signs</li>
                      <li>Brochures and marketing materials</li>
                      <li>Your farm stand or shop displays</li>
                      <li>Invoices and order receipts</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {qrDownloaded && (
                <div className="border border-green-200 bg-green-50 p-4 rounded-md mt-2">
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5 mr-3" size={20} />
                    <div>
                      <h3 className="font-medium text-green-700">QR Code Downloaded</h3>
                      <p className="text-sm text-green-700 mt-1">
                        Your QR code has been downloaded successfully. You can now print it or add it to your product labels.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductQR;
