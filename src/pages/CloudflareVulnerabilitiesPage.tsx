import { Shield, Construction } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CloudflareHeader from '@/components/layout/CloudflareHeader';

/**
 * Cloudflare Vulnerabilities Page
 * Detailed vulnerability listing
 */

const CloudflareVulnerabilitiesPage = () => {
  return (
    <div className="min-h-screen w-full">
      <CloudflareHeader />
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-orange-500" />
            <h1 className="text-2xl md:text-3xl font-bold">All Vulnerabilities</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Complete list of all Cloudflare vulnerabilities
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
          <CardContent className="flex items-center gap-4 py-4">
            <Construction className="h-8 w-8 text-orange-500" />
            <div>
              <p className="font-medium">Use Dashboard for Now</p>
              <p className="text-sm text-muted-foreground">
                The main Dashboard contains the full vulnerability table with all features. 
                This page will provide additional views in future updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CloudflareVulnerabilitiesPage;
