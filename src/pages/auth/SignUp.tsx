
import React from 'react';
import AuthLayout from '@/features/auth/components/AuthLayout';
import SignUpForm from '@/features/auth/components/SignUpForm';

const SignUp = () => {
  return (
    <AuthLayout 
      title="Create an account" 
      description="Sign up to start monitoring your security"
    >
      <SignUpForm />
    </AuthLayout>
  );
};

export default SignUp;
