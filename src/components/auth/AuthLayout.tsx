
import React from 'react';
import { Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const AuthLayout = ({ title, description, children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center">
            <Shield className="h-12 w-12 text-primary" />
            <span className="ml-2 text-3xl font-bold text-white">HAWK</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-gray-300">{description}</p>
        </div>

        <Card className="p-6 shadow-xl backdrop-blur-sm bg-white/10 border-white/20">
          {children}
        </Card>
      </div>
    </div>
  );
};

export default AuthLayout;
