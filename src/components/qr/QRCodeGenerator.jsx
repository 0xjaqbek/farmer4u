// src/components/qr/QRCodeGenerator.jsx - QR Code generator
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';

const QRCodeGenerator = ({ data, size = 200, title = 'Product QR Code' }) => {
  const [qrData, setQrData] = useState('');
  
  useEffect(() => {
    if (data) {
      // Convert data to JSON string
      setQrData(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, [data]);
  
  const handleDownload = () => {
    const canvas = document.getElementById('qr-code-canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };
  
  if (!qrData) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG 
            id="qr-code-canvas"
            value={qrData} 
            size={size} 
            level="H" 
            includeMargin={true}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={handleDownload} 
          className="mt-4"
        >
          <Download className="mr-2 h-4 w-4" />
          Download QR Code
        </Button>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;