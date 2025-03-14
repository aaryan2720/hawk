
import React from 'react';
import DashboardNav from '@/components/DashboardNav';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GeminiChatbot from '@/components/GeminiChatbot';

const ChatBot = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary/70">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground mt-1">
            Get assistance with security questions and vulnerability analysis
          </p>
        </div>
        
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle>Security Assistant</CardTitle>
            <CardDescription>
              Ask questions about cybersecurity, get vulnerability assessments, or analyze potential threats
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[600px] flex items-center justify-center">
              <div className="w-full max-w-3xl">
                <GeminiChatbot startExpanded={true} />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ChatBot;
