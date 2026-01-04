import { Settings, Bell, Shield, Database, Construction } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import CloudflareHeader from '@/components/layout/CloudflareHeader';

/**
 * Cloudflare Settings Page
 * Configure module settings
 */

const CloudflareSettings = () => {
  return (
    <div className="min-h-screen w-full">
      <CloudflareHeader />
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-orange-500" />
            <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Configure Cloudflare module preferences
          </p>
        </div>

        {/* Settings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-alerts">Email Alerts</Label>
                <Switch id="email-alerts" disabled />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="critical-only">Critical Only</Label>
                <Switch id="critical-only" disabled />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="daily-digest">Daily Digest</Label>
                <Switch id="daily-digest" disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Scanning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-scan">Auto Scan</Label>
                <Switch id="auto-scan" disabled />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="deep-scan">Deep Scan Mode</Label>
                <Switch id="deep-scan" disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5" />
                Data Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="archive">Archive Old Data</Label>
                <Switch id="archive" disabled />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="export-auto">Auto Export</Label>
                <Switch id="export-auto" disabled />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
          <CardContent className="flex items-center gap-4 py-4">
            <Construction className="h-8 w-8 text-orange-500" />
            <div>
              <p className="font-medium">Settings Coming Soon</p>
              <p className="text-sm text-muted-foreground">
                Settings configuration will be available once connected to the backend API.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CloudflareSettings;
