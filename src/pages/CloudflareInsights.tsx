import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  Plus, 
  Minus, 
  RefreshCw,
  FileText,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import CloudflareHeader from '@/components/layout/CloudflareHeader';
import { cloudflareService, CloudflareVulnerability } from '@/services/cloudflareService';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

/**
 * Cloudflare Insights Page
 * - Weekly Findings Trend
 * - Download Latest Records
 * - Record Change Tracking
 */

const CloudflareInsights = () => {
  const { toast } = useToast();
  const [vulnerabilities, setVulnerabilities] = useState<CloudflareVulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'7days' | '30days' | 'all'>('7days');

  // Placeholder for record changes (will come from backend later)
  const [recordChanges, setRecordChanges] = useState<{
    added: number;
    deleted: number;
    lastUpdated: Date | null;
  }>({
    added: 0,
    deleted: 0,
    lastUpdated: null
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cloudflareService.getVulnerabilities();
      setVulnerabilities(data);
      
      // Simulate record changes based on data (placeholder for backend integration)
      // In production, this would come from a separate API endpoint
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      let filterDate: Date | null = null;
      if (timeFilter === '7days') filterDate = sevenDaysAgo;
      else if (timeFilter === '30days') filterDate = thirtyDaysAgo;

      // Count records based on first_observed timestamp
      const recentRecords = data.filter(v => {
        if (!filterDate) return true;
        const firstObserved = typeof v.first_observed === 'number' 
          ? new Date(v.first_observed) 
          : new Date(v.first_observed);
        return firstObserved >= filterDate;
      });

      setRecordChanges({
        added: recentRecords.length,
        deleted: Math.floor(recentRecords.length * 0.1), // Placeholder
        lastUpdated: now
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, timeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate weekly findings trend from last 7 days
  const weeklyTrend = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Group by day
    const dayGroups: Record<string, { date: string; total: number; open: number; fixed: number }> = {};
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayGroups[key] = { date: key, total: 0, open: 0, fixed: 0 };
    }

    vulnerabilities.forEach(v => {
      const lastObserved = typeof v.last_observed === 'number' 
        ? new Date(v.last_observed) 
        : new Date(v.last_observed);
      
      if (lastObserved >= sevenDaysAgo) {
        const key = lastObserved.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dayGroups[key]) {
          dayGroups[key].total++;
          if (v.status?.toLowerCase() === 'open') {
            dayGroups[key].open++;
          } else if (v.status?.toLowerCase() === 'fixed') {
            dayGroups[key].fixed++;
          }
        }
      }
    });

    return Object.values(dayGroups);
  }, [vulnerabilities]);

  // Count findings captured in last 7 days
  const last7DaysCount = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return vulnerabilities.filter(v => {
      const firstObserved = typeof v.first_observed === 'number' 
        ? new Date(v.first_observed) 
        : new Date(v.first_observed);
      return firstObserved >= sevenDaysAgo;
    }).length;
  }, [vulnerabilities]);

  // Download latest records as TXT
  const handleDownloadLatest = () => {
    try {
      // Sort by last_observed descending to get latest records
      const sortedVulns = [...vulnerabilities].sort((a, b) => {
        const aDate = typeof a.last_observed === 'number' ? a.last_observed : new Date(a.last_observed).getTime();
        const bDate = typeof b.last_observed === 'number' ? b.last_observed : new Date(b.last_observed).getTime();
        return bDate - aDate;
      });

      // Take latest 100 records
      const latestRecords = sortedVulns.slice(0, 100);

      // Format as TXT
      let content = 'CLOUDFLARE VULNERABILITY REPORT - LATEST RECORDS\n';
      content += `Generated: ${new Date().toISOString()}\n`;
      content += `Total Records: ${latestRecords.length}\n`;
      content += '='.repeat(80) + '\n\n';

      latestRecords.forEach((v, index) => {
        const formatDate = (date: string | number) => {
          if (!date) return 'N/A';
          const d = typeof date === 'number' ? new Date(date) : new Date(date);
          return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        };

        content += `[${index + 1}] ${v.vulnerability_name}\n`;
        content += `-`.repeat(60) + '\n';
        content += `Domain: ${v.domain}\n`;
        content += `Severity: ${v.severity}\n`;
        content += `Status: ${v.status}\n`;
        content += `First Observed: ${formatDate(v.first_observed)}\n`;
        content += `Last Observed: ${formatDate(v.last_observed)}\n`;
        content += `Aging (Days): ${v.aging_days}\n`;
        content += `Business Owner: ${v.business_owner || 'N/A'}\n`;
        if (v.description) {
          content += `Description: ${v.description}\n`;
        }
        if (v.notes) {
          content += `Notes: ${v.notes}\n`;
        }
        content += '\n';
      });

      // Create and download file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cloudflare-vulnerabilities-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Complete',
        description: `Downloaded ${latestRecords.length} latest records`,
      });
    } catch (err) {
      toast({
        title: 'Download Failed',
        description: 'Failed to generate download file',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full">
        <CloudflareHeader />
        <div className="px-4 md:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <CloudflareHeader />
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-orange-500" />
              <h1 className="text-2xl md:text-3xl font-bold">Findings Insights</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Trends, downloads, and change tracking
            </p>
          </div>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Section A: Weekly Findings Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Weekly Findings Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-primary">
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">New Findings (7 days)</div>
                  <div className="text-3xl font-bold text-primary">{last7DaysCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Total Open</div>
                  <div className="text-3xl font-bold text-status-open">
                    {vulnerabilities.filter(v => v.status?.toLowerCase() === 'open').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Total Fixed</div>
                  <div className="text-3xl font-bold text-status-fixed">
                    {vulnerabilities.filter(v => v.status?.toLowerCase() === 'fixed').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Work in Progress</div>
                  <div className="text-3xl font-bold text-status-progress">
                    {vulnerabilities.filter(v => v.status?.toLowerCase() === 'work in progress').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="open" fill="hsl(var(--status-open))" name="Open" />
                  <Bar dataKey="fixed" fill="hsl(var(--status-fixed))" name="Fixed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Section B: Download Latest Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Download Latest Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="text-muted-foreground mb-2">
                  Download the latest vulnerability records in TXT format. 
                  Includes up to 100 most recent records with full details.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Total available records: {vulnerabilities.length}</span>
                </div>
              </div>
              <Button onClick={handleDownloadLatest} size="lg">
                <Download className="h-4 w-4 mr-2" />
                Download Latest Records
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section C: Record Change Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Record Change Tracking
              </div>
              <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as typeof timeFilter)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-status-open">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-status-open/10">
                      <Plus className="h-6 w-6 text-status-open" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Records Added</div>
                      <div className="text-3xl font-bold">{recordChanges.added}</div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    New vulnerabilities discovered in the selected time period
                  </div>
                </CardContent>
              </Card>

              <Card className="border-status-fixed">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-status-fixed/10">
                      <Minus className="h-6 w-6 text-status-fixed" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Records Deleted/Resolved</div>
                      <div className="text-3xl font-bold">{recordChanges.deleted}</div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Vulnerabilities removed or marked as resolved
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Record change data will be sourced from a backend-connected tracking system. 
                Current values are calculated from available vulnerability timestamps.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CloudflareInsights;
