// src/components/blockchain/TransactionHistory.jsx - View Blockchain Transactions
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const TransactionHistory = () => {
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (publicKey) {
      fetchTransactions();
    }
  }, [publicKey]);

  const fetchTransactions = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      
      const connection = new Connection('https://api.devnet.solana.com');
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 20 });
      
      const txDetails = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getTransaction(sig.signature, {
              commitment: 'confirmed'
            });
            return { ...sig, details: tx };
          } catch {
            return { ...sig, details: null };
          }
        })
      );
      
      setTransactions(txDetails);
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionType = (tx) => {
    // Simple heuristic - in production you'd analyze the transaction properly
    if (tx.details?.meta?.preBalances && tx.details?.meta?.postBalances) {
      const balanceChange = tx.details.meta.postBalances[0] - tx.details.meta.preBalances[0];
      return balanceChange > 0 ? 'received' : 'sent';
    }
    return 'unknown';
  };

  const formatAmount = (tx) => {
    if (tx.details?.meta?.preBalances && tx.details?.meta?.postBalances) {
      const balanceChange = Math.abs(tx.details.meta.postBalances[0] - tx.details.meta.preBalances[0]);
      return (balanceChange / 1e9).toFixed(4); // Convert lamports to SOL
    }
    return '0.0000';
  };

  if (!publicKey) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Connect wallet to view transaction history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transaction History</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions found</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const type = getTransactionType(tx);
              const amount = formatAmount(tx);
              const isSuccess = !tx.err;
              
              return (
                <div key={tx.signature} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      type === 'received' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {type === 'received' ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {type === 'received' ? 'Received' : 'Sent'} {amount} SOL
                        </span>
                        
                        <Badge variant={isSuccess ? 'default' : 'destructive'}>
                          {isSuccess ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {isSuccess ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(tx.blockTime * 1000).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    asChild
                  >
                    <a 
                      href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};