import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const AuthLayout = ({ title, description, children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Soft ambient wash */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: 'var(--gradient-surface)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-40 -right-32 h-96 w-96 rounded-full blur-3xl opacity-20"
        style={{ background: 'var(--gradient-primary)' }}
        aria-hidden="true"
      />

      <div className="max-w-xl w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 px-5 py-3 rounded-full bg-card border border-border shadow-[var(--shadow-soft)]">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground tracking-tight">HAWK</span>
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-foreground tracking-tight">{title}</h1>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">{description}</p>
        </div>

        <Card className="p-8 bg-card border-border rounded-xl shadow-[var(--shadow-elevated)] relative overflow-hidden">
          <div className="absolute top-4 right-4 text-muted-foreground/10" aria-hidden="true">
            <Lock className="h-20 w-20 rotate-12" />
          </div>
          <div className="relative z-10">{children}</div>
        </Card>

        <div className="mt-8 text-center text-sm flex flex-col items-center text-muted-foreground">
          <p>Secure authentication powered by HAWK</p>
          <div className="flex items-center mt-2 gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-xs">Enterprise-grade security</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
