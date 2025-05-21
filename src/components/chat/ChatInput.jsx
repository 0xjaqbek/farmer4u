import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

const ChatInput = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || disabled || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onSendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-4">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || isSubmitting}
        autoFocus
      />
      <Button 
        type="submit" 
        size="icon"
        disabled={!message.trim() || disabled || isSubmitting}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default ChatInput;