import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { subscribeToConversations } from '@/firebase/chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ConversationItem from '@/components/chat/ConversationItem';
import { MessageSquare } from 'lucide-react';

const ChatList = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    // Subscribe to conversations
    const unsubscribe = subscribeToConversations(currentUser.uid, (data) => {
      setConversations(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  const handleConversationClick = (conversationId) => {
    navigate(`/chat/${conversationId}`);
  };
  
  if (loading) {
    return <div className="text-center py-8">Loading conversations...</div>;
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Your Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {conversations.length > 0 ? (
            <div className="divide-y">
              {conversations.map(conversation => (
                <div 
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <ConversationItem 
                    conversation={conversation} 
                    isSelected={false} 
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                You don't have any conversations yet.
              </p>
              <Button asChild>
                <Link to="/browse">Browse products to chat with farmers</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatList;