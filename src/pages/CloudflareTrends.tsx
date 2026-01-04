import { TrendingUp, BarChart3, Calendar, Construction } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CloudflareHeader from '@/components/layout/CloudflareHeader';

/**
 * Cloudflare Trends Page
 * Shows vulnerability trends over time
 */

const CloudflareTrends = () => {
  return (
    <div className="min-h-screen w-full">
      <CloudflareHeader />
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-orange-500" />
            <h1 className="text-2xl md:text-3xl font-bold">Vulnerability Trends</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Weekly and monthly vulnerability trend analysis
          </p>
        </div>

        {/* Placeholder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Weekly Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Weekly vulnerability trends chart</p>
                  <p className="text-sm">Data will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Monthly vulnerability trends chart</p>
                  <p className="text-sm">Data will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Severity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Severity-wise Charts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center border-2 border-dashed rounded-lg">
              <div className="text-center text-muted-foreground">
                <Construction className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Severity breakdown visualization</p>
                <p className="text-sm">Connect to backend to populate data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CloudflareTrends;
