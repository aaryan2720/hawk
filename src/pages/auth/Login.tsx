
import React from 'react';
import AuthLayout from '@/features/auth/components/AuthLayout';
import LoginForm from '@/features/auth/components/LoginForm';

const Login = () => {
  return (
    <AuthLayout 
      title="Welcome back" 
      description="Sign in to access your security dashboard"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default Login;
