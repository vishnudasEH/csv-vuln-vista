import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, Shield, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Internal Server Vulnerabilities Page
 * 
 * Placeholder page for internal server vulnerability scanning module.
 * Routes existing vulnerability pages to this module.
 */

const InternalServerDashboard = () => {
  const navigate = useNavigate();

  const modules = [
    { path: '/host-based', label: 'Host-Based Vulnerabilities', description: 'View vulnerabilities grouped by host' },
    { path: '/vulnerability-based', label: 'All Vulnerabilities', description: 'View complete vulnerability list' },
    { path: '/analytics', label: 'Analytics Dashboard', description: 'Charts and metrics overview' },
    { path: '/assigned-to', label: 'Team Workload', description: 'View assignments by team member' },
    { path: '/business-owners', label: 'Business Owners', description: 'Owner responsibility view' },
  ];

  return (
    <div className="min-h-screen w-full px-4 md:px-6 lg:px-8 py-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Server className="h-6 w-6 text-blue-500" />
              <h1 className="text-2xl md:text-3xl font-bold">Internal Server Vulnerabilities</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Manage vulnerabilities from internal server scans
            </p>
          </div>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <Card
              key={module.path}
              className="cursor-pointer hover:shadow-lg transition-shadow hover:border-primary"
              onClick={() => navigate(module.path)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-blue-500" />
                  {module.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{module.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="flex items-center gap-4 py-4">
            <Construction className="h-8 w-8 text-blue-500" />
            <div>
              <p className="font-medium">Data Source Connected</p>
              <p className="text-sm text-muted-foreground">
                This module uses the existing internal vulnerability data from your backend scans.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InternalServerDashboard;
