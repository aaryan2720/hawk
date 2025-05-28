
import React from 'react';
import DashboardNav from '@/components/DashboardNav';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import GeminiChatbot from '@/components/GeminiChatbot';
import { Bot, Shield, Zap, MessageCircle, Brain, Lock } from 'lucide-react';

const ChatBot = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="text-primary font-medium">Loading AI Assistant...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  const features = [
    {
      icon: Shield,
      title: "Vulnerability Analysis",
      description: "Get detailed analysis of security vulnerabilities and their impact"
    },
    {
      icon: Zap,
      title: "Instant Solutions",
      description: "Receive immediate remediation steps and security recommendations"
    },
    {
      icon: Brain,
      title: "Smart Insights",
      description: "AI-powered threat intelligence and risk assessment"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DashboardNav />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Bot className="h-4 w-4" />
              AI-Powered Security Assistant
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              HAWK Security 
              <span className="text-blue-600"> AI Assistant</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Get instant help with cybersecurity questions, vulnerability analysis, and threat assessment from our advanced AI assistant.
            </p>
            
            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {features.map((feature, index) => (
                <Card key={index} className="glass-card hover:shadow-lg transition-all duration-300 border-0">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <main className="container mx-auto px-4 pb-8">
        <Card className="max-w-5xl mx-auto shadow-2xl border-0 glass-card">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">Security AI Assistant</CardTitle>
                <CardDescription className="text-blue-100">
                  Ask questions about cybersecurity, vulnerabilities, or get threat analysis
                </CardDescription>
              </div>
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                <Lock className="h-3 w-3 mr-1" />
                Secure
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="h-[650px] relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600"></div>
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
              </div>
              
              {/* Chat Interface */}
              <div className="relative h-full flex items-center justify-center p-8">
                <div className="w-full max-w-4xl">
                  <GeminiChatbot startExpanded={true} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="max-w-5xl mx-auto mt-8">
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">AI Assistant Capabilities</h3>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Analyze security vulnerabilities and provide remediation steps</li>
                    <li>• Explain complex cybersecurity concepts in simple terms</li>
                    <li>• Help with incident response and threat assessment</li>
                    <li>• Provide best practices for security configurations</li>
                    <li>• Assist with compliance and security framework questions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ChatBot;
