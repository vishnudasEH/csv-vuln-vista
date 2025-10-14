import { Navigate } from 'react-router-dom';

/**
 * PrivateRoute Component
 * 
 * This component protects routes by checking if the user is authenticated.
 * It checks for the presence of 'authToken' in localStorage.
 * 
 * How it works:
 * 1. Reads authToken from localStorage on render
 * 2. If token exists, renders the child components (protected content)
 * 3. If token is missing, redirects to /login page
 * 
 * Usage: Wrap any route that requires authentication with this component
 */

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  // Check if authentication token exists in localStorage
  // This token is set during successful login and cleared on logout
  const authToken = localStorage.getItem('authToken');

  // If no token found, redirect to login page
  // replace=true prevents adding to browser history (can't go back to protected page)
  if (!authToken) {
    return <Navigate to="/login" replace />;
  }

  // Token exists - render the protected content
  return <>{children}</>;
};

export default PrivateRoute;
