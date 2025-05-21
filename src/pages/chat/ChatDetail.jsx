import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  getConversationById,
  subscribeToMessages,
  sendMessage,
  markConversationAsRead
} from '@/firebase/chat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import { ArrowLeft, User, MessagesSquare } from 'lucide-react';

const ChatDetail = () => {
  const { id } = useParams();
  const { id: conversationId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);
  
  const otherParticipant = conversation?.participantsInfo.find(
    p => p.uid !== currentUser?.uid
  );
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load conversation and subscribe to messages
  useEffect(() => {
    if (!currentUser || !conversationId) return;
    
    const loadConversation = async () => {
        try {
          setLoading(true);
          const conversation = await getConversationById(id); // may create one
          setConversation(conversation);
      
          // Wait for Firestore to propagate the new conversation if just created
          await new Promise(resolve => setTimeout(resolve, 500)); // small delay
      
          // Now mark it as read
          await markConversationAsRead(conversation.id, currentUser.uid);
      
        } catch (error) {
          console.error('Error loading conversation:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
      
    
    loadConversation();
    
    // Subscribe to messages
    const unsubscribe = subscribeToMessages(conversationId, (data) => {
      setMessages(data);
      
      // Mark conversation as read when new messages arrive
      if (data.length > 0 && data[data.length - 1].senderId !== currentUser.uid) {
        markConversationAsRead(conversationId, currentUser.uid).catch(err => {
          console.error('Error marking conversation as read:', err);
        });
      }
    });
    
    return () => unsubscribe();
  }, [currentUser, conversationId]);
  
  // Handle sending message
  const handleSendMessage = async (text) => {
    if (!currentUser || !conversation) return;
    
    const messageData = {
      text,
      senderId: currentUser.uid,
      senderName: `${userProfile.firstName} ${userProfile.lastName}`,
      recipientId: otherParticipant.uid
    };
    
    await sendMessage(conversationId, messageData);
  };
  
  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  if (loading) {
    return <div className="text-center py-8">Loading conversation...</div>;
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button asChild>
          <Link to="/chat">Back to Messages</Link>
        </Button>
      </div>
    );
  }
  
  if (!conversation) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Conversation not found.</p>
        <Button asChild>
          <Link to="/chat">Back to Messages</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/chat')}
          className="mr-2"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-bold">Chat</h1>
      </div>
      
      <Card className="h-[70vh] flex flex-col">
        <CardHeader className="px-4 py-3 border-b flex flex-row items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback>
              {otherParticipant ? getInitials(otherParticipant.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium">
              {otherParticipant ? otherParticipant.name : 'Unknown User'}
            </h2>
            <p className="text-xs text-gray-500">
              {otherParticipant?.role === 'rolnik' ? 'Farmer' : 'Customer'}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
              <MessagesSquare className="h-16 w-16 text-gray-300 mb-4" />
              <p className="mb-2">No messages yet</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          ) : (
            <>
              {messages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>
        
        <div className="p-3 border-t">
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </Card>
    </div>
  );
};

export default ChatDetail;