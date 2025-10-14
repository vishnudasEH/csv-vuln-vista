import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Database, Network, BarChart3, Users, List, Building2, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Logout Handler
   * 
   * This function handles user logout by:
   * 1. Removing the JWT token from localStorage
   * 2. Redirecting the user to the login page
   * 
   * This ensures the user can no longer access protected routes
   */
  const handleLogout = () => {
    // Clear the authentication token from localStorage
    localStorage.removeItem('authToken');
    console.log('User logged out. Token removed from localStorage.');
    
    // Redirect to login page
    navigate('/login');
  };

  // Check if user is authenticated (has token)
  const isAuthenticated = localStorage.getItem('authToken') !== null;

  const navItems = [
    { path: '/', label: 'Consolidated Findings', icon: Database },
    { path: '/host-based', label: 'Host-Based Vulnerabilities', icon: Network },
    { path: '/analytics', label: 'Analytics Dashboard', icon: BarChart3 },
    { path: '/assigned-to', label: 'Team Workload', icon: Users },
    { path: '/vulnerability-based', label: 'All Vulnerabilities', icon: List },
    { path: '/business-owners', label: 'Business Owners', icon: Building2 },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Shield className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-xl font-bold">Vulnerability Dashboard</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
                      location.pathname === item.path
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Logout Button - Only shown when user is authenticated */}
          {isAuthenticated && (
            <div className="flex items-center">
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