
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, Loader, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const GeminiChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiConversation, setApiConversation] = useState<any[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    // Add a welcome message when the component mounts
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m your security assistant. How can I help you today?',
        timestamp: new Date()
      }
    ]);
  }, []);
  
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message to the chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          message: inputMessage,
          conversation: apiConversation
        }
      });
      
      if (error) throw error;
      
      // Store the conversation for the next request
      if (data.conversation) {
        setApiConversation(data.conversation);
      }
      
      // Add assistant message to the chat
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message || "I'm having trouble understanding that. Could you try rephrasing?",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      toast.error('Failed to get a response from the AI assistant');
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat history cleared. How can I help you today?',
      timestamp: new Date()
    }]);
    setApiConversation([]);
  };
  
  return (
    <Card className={`fixed bottom-4 right-4 w-80 md:w-96 shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'h-14' : 'h-[500px]'}`}>
      <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between cursor-pointer" onClick={toggleCollapse}>
        <div className="flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          <span className="font-medium">Security Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          {!isCollapsed && <X className="h-4 w-4 cursor-pointer hover:text-gray-200" onClick={(e) => { e.stopPropagation(); clearChat(); }} />}
          {isCollapsed ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>
      
      {!isCollapsed && (
        <>
          <ScrollArea className="flex-1 p-4 h-[400px]">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                className="min-h-9 resize-none"
                disabled={isLoading}
              />
              <Button 
                onClick={sendMessage} 
                size="icon" 
                disabled={isLoading || !inputMessage.trim()}
              >
                {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default GeminiChatbot;
