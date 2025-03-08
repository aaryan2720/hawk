
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle, Lock, BarChart2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold tracking-tight">HAWK</span>
            </div>
            <div className="space-x-4">
              <Link to="/auth/login" className="text-gray-200 hover:text-white transition-colors">
                Log in
              </Link>
              <Link to="/auth/signup">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900 transition-colors">
                  Sign up
                </Button>
              </Link>
            </div>
          </nav>
          
          <div className="py-24 max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Enterprise-Grade Security Monitoring
            </h1>
            <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto">
              HAWK provides real-time security monitoring and vulnerability management for 
              organizations of all sizes. Detect threats before they impact your business.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md transition-all">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="mailto:sales@hawksecurity.example.com">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-900 w-full sm:w-auto shadow-md transition-all">
                  Request Demo
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <AlertTriangle className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-time Alerts</h3>
              <p className="text-gray-600">
                Receive instant notifications for security threats and vulnerabilities affecting your systems.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <BarChart2 className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Comprehensive Analytics</h3>
              <p className="text-gray-600">
                Gain insights into your security posture with detailed reports and vulnerability trends.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Lock className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure by Design</h3>
              <p className="text-gray-600">
                Built with security best practices to ensure your data remains protected at all times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Trusted by Security Leaders</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="italic text-gray-700 mb-4">
                "HAWK has transformed how we manage security vulnerabilities across our organization. 
                The real-time alerts have helped us respond to threats much faster."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="ml-4">
                  <p className="font-semibold">Jamie Smith</p>
                  <p className="text-sm text-gray-600">CISO, TechCorp Inc.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="italic text-gray-700 mb-4">
                "The comprehensive dashboard and reporting features give us complete visibility into our 
                security posture. We've been able to reduce our vulnerability response time by 60%."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="ml-4">
                  <p className="font-semibold">Alex Johnson</p>
                  <p className="text-sm text-gray-600">Head of IT Security, Global Services Ltd</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to enhance your security?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of organizations that trust HAWK to monitor and protect their critical systems.
          </p>
          <Link to="/auth/signup">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary shadow-md transition-all">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-8 w-8 text-primary" />
                <span className="text-xl font-semibold">HAWK</span>
              </div>
              <p className="text-gray-400 max-w-xs">
                Enterprise-grade security monitoring and vulnerability management solution.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white">Features</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">API</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white">About</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Support</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500">© 2023 HAWK Security. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
