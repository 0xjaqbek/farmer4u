// src/components/blockchain/CryptoPayment.jsx
import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Zap, DollarSign } from 'lucide-react';

export const CryptoPayment = ({ order, onPaymentSuccess, onPaymentError }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCryptoPayment = async () => {
    if (!publicKey || !order) return;

    try {
      setIsProcessing(true);

      // Adres portfela rolnika (z profilu rolnika)
      const farmerWallet = new PublicKey(order.rolnikWallet || order.rolnikId);
      
      // Kwota w SOL (dla uproszczenia, 1 USD = 0.01 SOL)
      const solAmount = order.totalPrice * 0.01;
      const lamports = solAmount * LAMPORTS_PER_SOL;

      // Stwórz transakcję
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: farmerWallet,
          lamports,
        })
      );

      // Wyślij transakcję
      const signature = await sendTransaction(transaction, connection);
      
      // Poczekaj na potwierdzenie
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('Payment successful:', signature);
      
      if (onPaymentSuccess) {
        onPaymentSuccess({
          signature,
          amount: solAmount,
          currency: 'SOL',
          method: 'crypto'
        });
      }

    } catch (error) {
      console.error('Crypto payment failed:', error);
      
      if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!publicKey) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 mb-4">Connect wallet to pay with cryptocurrency</p>
          <Button variant="outline" disabled>
            <Zap className="mr-2 h-4 w-4" />
            Crypto Payment Unavailable
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="mr-2 h-5 w-5" />
          Pay with Cryptocurrency
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Order Total</p>
                <p className="text-sm text-gray-600">${order?.totalPrice?.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">≈ {(order?.totalPrice * 0.01)?.toFixed(4)} SOL</p>
                <p className="text-xs text-gray-500">Rate: 1 USD = 0.01 SOL</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="text-sm">Payment will be sent directly to farmer</span>
          </div>

          <Button 
            onClick={handleCryptoPayment}
            disabled={isProcessing || !order}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Pay {(order?.totalPrice * 0.01)?.toFixed(4)} SOL
              </>
            )}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            <p>Payment is processed on Solana blockchain</p>
            <p>Transaction fees apply (≈ $0.00025)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};