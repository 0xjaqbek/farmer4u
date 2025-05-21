import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const ChatMessage = ({ message }) => {
  const { currentUser } = useAuth();
  const isCurrentUser = message.senderId === currentUser?.uid;
  
  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 mr-2">
          <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
        </Avatar>
      )}
      
      <div className="max-w-xs md:max-w-md">
        <div
          className={`rounded-lg px-4 py-2 ${
            isCurrentUser
              ? 'bg-green-500 text-white rounded-tr-none'
              : 'bg-gray-100 text-gray-800 rounded-tl-none'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        </div>
        <div className={`mt-1 text-xs text-gray-500 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;