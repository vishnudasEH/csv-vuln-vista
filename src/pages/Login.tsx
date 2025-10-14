import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create a dark theme for Material UI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const Login = () => {
  const navigate = useNavigate();
  
  // State to manage form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // State to manage error messages
  const [error, setError] = useState('');
  // State to manage loading state during API call
  const [loading, setLoading] = useState(false);

  /**
   * Check if user is already logged in on component mount
   * If authToken exists, redirect to home page
   */
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      navigate('/');
    }
  }, [navigate]);

  // Handle login button click
  const handleLogin = async () => {
    // Clear any previous errors
    setError('');
    setLoading(true);

    try {
      // Send POST request to backend API with username and password
      const response = await fetch('http://10.23.123.40:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      // Parse the JSON response
      const data = await response.json();

      // Check if login was successful
      if (data.status === 'success' && data.token) {
        // Save JWT token to localStorage
        // This token will be checked by PrivateRoute to allow access to protected pages
        localStorage.setItem('authToken', data.token);
        console.log('Login successful! Token saved to localStorage.');
        
        // Redirect to home page (dashboard)
        navigate('/');
      } else {
        // Login failed - display error message from API
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      // Handle network errors or other exceptions
      setError('An error occurred while connecting to the server. Please try again.');
      console.error('Login error:', err);
    } finally {
      // Reset loading state
      setLoading(false);
    }
  };

  // Handle Enter key press in form fields
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default',
          padding: 2,
        }}
      >
        {/* Login form container */}
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            maxWidth: 400,
            width: '100%',
            borderRadius: 2,
          }}
        >
          {/* Page title */}
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Login
          </Typography>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Enter your credentials to access the dashboard
          </Typography>

          {/* Username input field */}
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            margin="normal"
            autoComplete="username"
          />

          {/* Password input field */}
          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            margin="normal"
            autoComplete="current-password"
          />

          {/* Error message display - only shown if there's an error */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login button */}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            onClick={handleLogin}
            disabled={loading || !username || !password}
            sx={{ mt: 3 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default Login;
