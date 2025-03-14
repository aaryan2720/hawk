import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'; 
import { Bot, Send, Loader, X, MessageCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GeminiChatbotProps {
  startExpanded?: boolean;
}

const GeminiChatbot: React.FC<GeminiChatbotProps> = ({ startExpanded = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiConversation, setApiConversation] = useState<any[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(!startExpanded);
  const [isMinimized, setIsMinimized] = useState(!startExpanded);
  const [apiKeyError, setApiKeyError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (!isMinimized && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I\'m your security assistant. How can I help you today?',
          timestamp: new Date()
        }
      ]);
    }
  }, [isMinimized]);
  
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    setApiKeyError(false);
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          message: inputMessage,
          conversation: apiConversation
        }
      });
      
      if (error) throw error;
      
      if (!data.success) {
        if (data.errorType === 'missing_api_key') {
          setApiKeyError(true);
          throw new Error('Gemini API key is not configured. Please add it to Supabase Edge Function secrets.');
        } else {
          throw new Error(data.error || "Failed to get a response");
        }
      }
      
      if (data.conversation) {
        setApiConversation(data.conversation);
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message || "I'm having trouble understanding that. Could you try rephrasing?",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      
      const errorMessage = error.message.includes('API key') 
        ? 'The Gemini API key is not configured. Please add it to Supabase Edge Function secrets.'
        : 'Failed to get a response from the AI assistant. Please try again later.';
      
      toast.error(errorMessage);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage,
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
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setIsCollapsed(false);
    }
  };
  
  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat history cleared. How can I help you today?',
      timestamp: new Date()
    }]);
    setApiConversation([]);
    setApiKeyError(false);
  };
  
  if (isMinimized) {
    return (
      <Button 
        onClick={toggleMinimize}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all duration-300 z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }
  
  return (
    <Card className={`fixed bottom-4 right-4 w-80 md:w-96 shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'h-14' : 'h-[500px]'} z-50`}>
      <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between cursor-pointer" onClick={toggleCollapse}>
        <div className="flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          <span className="font-medium">Security Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          {!isCollapsed && <X className="h-4 w-4 cursor-pointer hover:text-gray-200" onClick={(e) => { e.stopPropagation(); clearChat(); }} />}
          <X className="h-5 w-5 cursor-pointer hover:text-gray-200" onClick={(e) => { e.stopPropagation(); toggleMinimize(); }} />
        </div>
      </div>
      
      {!isCollapsed && (
        <>
          {apiKeyError && (
            <Alert variant="destructive" className="m-3 mb-0">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuration Error</AlertTitle>
              <AlertDescription>
                Gemini API key is not configured. Please add GEMINI_API_KEY to Supabase Edge Function secrets.
              </AlertDescription>
            </Alert>
          )}
          
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
