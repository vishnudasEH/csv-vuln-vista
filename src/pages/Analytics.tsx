import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVulnerabilities } from '@/hooks/useVulnerabilities';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Clock, Users } from 'lucide-react';
import { format, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { useMemo } from 'react';

const Analytics = () => {
  const { filteredVulnerabilities, loading, error } = useVulnerabilities();

  const analytics = useMemo(() => {
    if (!filteredVulnerabilities.length) return null;

    // Severity distribution
    const severityCounts = filteredVulnerabilities.reduce((acc, vuln) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const severityData = Object.entries(severityCounts).map(([severity, count]) => ({
      name: severity,
      value: count,
      color: {
        'Critical': 'hsl(var(--severity-critical))',
        'High': 'hsl(var(--severity-high))',
        'Medium': 'hsl(var(--severity-medium))',
        'Low': 'hsl(var(--severity-low))',
        'Info': 'hsl(var(--severity-info))'
      }[severity]
    }));

    // Host distribution (top 10)
    const hostCounts = filteredVulnerabilities.reduce((acc, vuln) => {
      acc[vuln.host] = (acc[vuln.host] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const hostData = Object.entries(hostCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([host, count]) => ({ host, count }));

    // Status counts
    const statusCounts = filteredVulnerabilities.reduce((acc, vuln) => {
      acc[vuln.status] = (acc[vuln.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Overdue counts
    const overdueCount = filteredVulnerabilities.filter(v => v.days_overdue > 0).length;
    const criticalOverdue = filteredVulnerabilities.filter(v => v.days_overdue > 0 && v.severity === 'Critical').length;

    // Weekly trend (last 8 weeks)
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const date = startOfWeek(subWeeks(new Date(), i));
      return {
        week: format(date, 'MMM dd'),
        date,
        open: 0,
        closed: 0
      };
    }).reverse();

    filteredVulnerabilities.forEach(vuln => {
      try {
        const vulnDate = parseISO(vuln.timestamp);
        const weekIndex = weeks.findIndex(w => {
          const weekEnd = new Date(w.date);
          weekEnd.setDate(weekEnd.getDate() + 7);
          return vulnDate >= w.date && vulnDate < weekEnd;
        });
        
        if (weekIndex !== -1) {
          if (vuln.status === 'Closed' || vuln.status === 'Resolved') {
            weeks[weekIndex].closed++;
          } else {
            weeks[weekIndex].open++;
          }
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Top vulnerable hosts
    const topHosts = Object.entries(hostCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([host, count]) => ({
        host,
        total: count,
        critical: filteredVulnerabilities.filter(v => v.host === host && v.severity === 'Critical').length,
        high: filteredVulnerabilities.filter(v => v.host === host && v.severity === 'High').length
      }));

    return {
      severityData,
      hostData,
      statusCounts,
      overdueCount,
      criticalOverdue,
      trendData: weeks,
      topHosts,
      total: filteredVulnerabilities.length
    };
  }, [filteredVulnerabilities]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Analytics Unavailable</h2>
        <p className="text-muted-foreground">{error || 'No data available for analysis'}</p>
      </div>
    );
  }

  const { severityData, hostData, statusCounts, overdueCount, criticalOverdue, trendData, topHosts, total } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Security Analytics Dashboard</h1>
        <Badge variant="secondary" className="text-sm">
          {total} Total Findings
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Total Findings</h3>
            </div>
            <p className="text-3xl font-bold mt-2">{total}</p>
            <p className="text-sm text-muted-foreground">
              {statusCounts.Open || 0} open, {statusCounts.Closed || 0} closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-severity-critical" />
              <h3 className="font-medium">Critical Issues</h3>
            </div>
            <p className="text-3xl font-bold mt-2 text-severity-critical">
              {severityData.find(s => s.name === 'Critical')?.value || 0}
            </p>
            <p className="text-sm text-muted-foreground">
              {criticalOverdue} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-severity-high" />
              <h3 className="font-medium">Overdue Items</h3>
            </div>
            <p className="text-3xl font-bold mt-2 text-severity-high">{overdueCount}</p>
            <p className="text-sm text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Affected Hosts</h3>
            </div>
            <p className="text-3xl font-bold mt-2">{hostData.length}</p>
            <p className="text-sm text-muted-foreground">
              Systems with vulnerabilities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {severityData.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vulnerabilities by Host (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hostData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="host" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Vulnerability Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="open" 
                  stroke="hsl(var(--severity-critical))" 
                  strokeWidth={2}
                  name="Open"
                />
                <Line 
                  type="monotone" 
                  dataKey="closed" 
                  stroke="hsl(var(--cyber-success))" 
                  strokeWidth={2}
                  name="Closed"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Vulnerable Hosts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topHosts.map((host, index) => (
                <div key={host.host} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm truncate max-w-[120px]">{host.host}</p>
                    <div className="flex gap-2 mt-1">
                      {host.critical > 0 && (
                        <Badge variant="destructive" className="text-xs px-1 py-0">
                          {host.critical}C
                        </Badge>
                      )}
                      {host.high > 0 && (
                        <Badge className="text-xs px-1 py-0 bg-severity-high text-white">
                          {host.high}H
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">{host.total}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;