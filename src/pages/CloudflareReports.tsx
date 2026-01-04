import { FileText, Download, Calendar, Construction } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CloudflareHeader from '@/components/layout/CloudflareHeader';

/**
 * Cloudflare Reports Page
 * Generate and download reports
 */

const CloudflareReports = () => {
  return (
    <div className="min-h-screen w-full">
      <CloudflareHeader />
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-orange-500" />
            <h1 className="text-2xl md:text-3xl font-bold">Reports</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Generate and download vulnerability reports
          </p>
        </div>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-500" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                High-level overview of vulnerability status for leadership
              </p>
              <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-green-500" />
                Monthly Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Detailed monthly vulnerability analysis and trends
              </p>
              <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-purple-500" />
                Technical Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                In-depth technical details for security teams
              </p>
              <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
          <CardContent className="flex items-center gap-4 py-4">
            <Construction className="h-8 w-8 text-orange-500" />
            <div>
              <p className="font-medium">Reports Coming Soon</p>
              <p className="text-sm text-muted-foreground">
                Report generation will be available once connected to the backend API.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CloudflareReports;
