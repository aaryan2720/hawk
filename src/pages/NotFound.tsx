
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    document.body.classList.add('bg-gradient-to-br', 'from-gray-50', 'to-blue-50');
    
    return () => {
      document.body.classList.remove('bg-gradient-to-br', 'from-gray-50', 'to-blue-50');
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-10 rounded-lg text-center max-w-md animate-fade-in">
        <div className="flex justify-center mb-4">
          <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-alert-high" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Page Not Found</p>
        <p className="text-gray-500 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <a 
          href="/" 
          className="inline-flex items-center justify-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 shadow-sm"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;
