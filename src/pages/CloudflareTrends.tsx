import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, BarChart3, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CloudflareHeader from '@/components/layout/CloudflareHeader';
import { cloudflareService, CloudflareVulnerability } from '@/services/cloudflareService';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { startOfWeek, endOfWeek, format, startOfYear, eachWeekOfInterval, startOfMonth, eachMonthOfInterval } from 'date-fns';

const CloudflareTrends = () => {
  const { toast } = useToast();
  const [vulnerabilities, setVulnerabilities] = useState<CloudflareVulnerability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await cloudflareService.getVulnerabilities();
        setVulnerabilities(data);
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  // Calculate weekly trends from Jan 1
  const weeklyTrends = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const today = new Date();
    const weeks = eachWeekOfInterval({ start: yearStart, end: today }, { weekStartsOn: 1 });

    return weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekVulns = vulnerabilities.filter(v => {
        const firstObserved = typeof v.first_observed === 'number' ? new Date(v.first_observed) : new Date(v.first_observed);
        return firstObserved >= weekStart && firstObserved <= weekEnd;
      });

      const open = weekVulns.filter(v => v.status?.toLowerCase() === 'open').length;
      const fixed = weekVulns.filter(v => v.status?.toLowerCase() === 'fixed').length;

      return {
        week: `W${index + 1}`,
        weekLabel: format(weekStart, 'MMM d'),
        total: weekVulns.length,
        open,
        fixed,
        critical: weekVulns.filter(v => v.severity?.toLowerCase() === 'critical').length,
        high: weekVulns.filter(v => v.severity?.toLowerCase() === 'high').length,
        medium: weekVulns.filter(v => v.severity?.toLowerCase() === 'medium').length,
        low: weekVulns.filter(v => v.severity?.toLowerCase() === 'low').length,
      };
    }).slice(-12); // Last 12 weeks
  }, [vulnerabilities]);

  // Calculate monthly trends
  const monthlyTrends = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const today = new Date();
    const months = eachMonthOfInterval({ start: yearStart, end: today });

    return months.map((monthStart) => {
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      const monthVulns = vulnerabilities.filter(v => {
        const firstObserved = typeof v.first_observed === 'number' ? new Date(v.first_observed) : new Date(v.first_observed);
        return firstObserved >= monthStart && firstObserved <= monthEnd;
      });

      return {
        month: format(monthStart, 'MMM'),
        total: monthVulns.length,
        open: monthVulns.filter(v => v.status?.toLowerCase() === 'open').length,
        fixed: monthVulns.filter(v => v.status?.toLowerCase() === 'fixed').length,
        critical: monthVulns.filter(v => v.severity?.toLowerCase() === 'critical').length,
        high: monthVulns.filter(v => v.severity?.toLowerCase() === 'high').length,
        medium: monthVulns.filter(v => v.severity?.toLowerCase() === 'medium').length,
        low: monthVulns.filter(v => v.severity?.toLowerCase() === 'low').length,
      };
    });
  }, [vulnerabilities]);

  const chartConfig = {
    open: { label: 'Open', color: 'hsl(var(--status-open))' },
    fixed: { label: 'Fixed', color: 'hsl(var(--status-fixed))' },
    critical: { label: 'Critical', color: 'hsl(var(--severity-critical))' },
    high: { label: 'High', color: 'hsl(var(--severity-high))' },
    medium: { label: 'Medium', color: 'hsl(var(--severity-medium))' },
    low: { label: 'Low', color: 'hsl(var(--severity-low))' },
  };

  return (
    <div className="min-h-screen w-full">
      <CloudflareHeader />
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-orange-500" />
              <h1 className="text-2xl md:text-3xl font-bold">Vulnerability Trends</h1>
            </div>
            <p className="text-muted-foreground mt-1">From Jan 1 – Weekly and monthly analysis</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Weekly Open vs Fixed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="weekLabel" className="text-xs" />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="open" fill="hsl(var(--status-open))" name="Open" />
                      <Bar dataKey="fixed" fill="hsl(var(--status-fixed))" name="Fixed" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Open vs Fixed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="open" stroke="hsl(var(--status-open))" strokeWidth={2} name="Open" />
                      <Line type="monotone" dataKey="fixed" stroke="hsl(var(--status-fixed))" strokeWidth={2} name="Fixed" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Severity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Severity Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="weekLabel" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="critical" stackId="a" fill="hsl(var(--severity-critical))" name="Critical" />
                    <Bar dataKey="high" stackId="a" fill="hsl(var(--severity-high))" name="High" />
                    <Bar dataKey="medium" stackId="a" fill="hsl(var(--severity-medium))" name="Medium" />
                    <Bar dataKey="low" stackId="a" fill="hsl(var(--severity-low))" name="Low" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CloudflareTrends;
