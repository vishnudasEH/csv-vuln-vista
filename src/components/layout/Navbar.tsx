import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Home, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Navbar Component
 * 
 * Simplified navigation bar showing:
 * - App logo and title
 * - Home button (to account selection)
 * - Logout button (when authenticated)
 */
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Logout Handler
   * 
   * This function handles user logout by:
   * 1. Removing the JWT token from localStorage
   * 2. Redirecting the user to the login page
   */
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    console.log('User logged out. Token removed from localStorage.');
    navigate('/login');
  };

  // Check if user is authenticated (has token)
  const isAuthenticated = localStorage.getItem('authToken') !== null;
  
  // Don't show navbar on login page
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <nav className="border-b bg-card">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold">Vulnerability Dashboard</h1>
            </Link>
          </div>
          
          {/* Right side - Home and Logout */}
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              {location.pathname !== '/' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
