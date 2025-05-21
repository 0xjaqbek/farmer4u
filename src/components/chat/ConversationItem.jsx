import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

const ConversationItem = ({ conversation, isSelected }) => {
  const { currentUser } = useAuth();
  
  // Get other participant info
  const getOtherParticipant = () => {
    const otherParticipantInfo = conversation.participantsInfo.find(
      p => p.uid !== currentUser?.uid
    );
    return otherParticipantInfo;
  };
  
  const otherParticipant = getOtherParticipant();
  
  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  // Check if message is read
  const isUnread = () => {
    // If no last message, conversation is read
    if (!conversation.lastMessage) return false;
    
    // If last message is from current user, it's read
    if (conversation.lastMessageSenderId === currentUser?.uid) return false;
    
    // Check if current user has read the conversation
    const readBy = conversation.readBy || {};
    const userReadTime = readBy[currentUser?.uid];
    
    // If user hasn't read the conversation at all
    if (!userReadTime) return true;
    
    // Compare last message time with read time
    const userReadDate = userReadTime.toDate();
    return conversation.updatedAt > userReadDate;
  };
  
  return (
    <div
      className={`flex items-center p-3 border-b cursor-pointer hover:bg-gray-50 ${
        isSelected ? 'bg-green-50' : ''
      } ${isUnread() ? 'bg-blue-50' : ''}`}
    >
      <Avatar className="h-10 w-10 mr-3">
        <AvatarFallback>{otherParticipant ? getInitials(otherParticipant.name) : 'U'}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <h3 className="font-medium truncate">
            {otherParticipant ? otherParticipant.name : 'Unknown User'}
          </h3>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
          </span>
        </div>
        
        <div className="flex justify-between">
          <p className={`text-sm truncate ${isUnread() ? 'font-semibold' : 'text-gray-500'}`}>
            {conversation.lastMessage || 'No messages yet'}
          </p>
          
          {isUnread() && (
            <span className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0"></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;