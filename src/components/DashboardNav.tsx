
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, History, User, Home } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardNav = () => {
  const { user } = useAuth();
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U";
    const email = user.email || "";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">SecureScanner</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/dashboard" className="flex items-center space-x-1">
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/scan-history" className="flex items-center space-x-1">
                <History className="h-4 w-4" />
                <span>Scan History</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/profile" className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </Button>
          </nav>
          
          <Link to="/profile" className="flex items-center space-x-2">
            <Avatar className="h-9 w-9 hover:ring-2 hover:ring-blue-400 transition-all">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-blue-600 text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium hidden md:inline-block">{user?.email}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardNav;
