import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVulnerabilities } from '@/hooks/useVulnerabilities';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Download, Presentation, Shield, AlertTriangle, Clock, TrendingUp, Copy } from 'lucide-react';
import { format, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { CSVService } from '@/services/csvService';

const SlideReadyView = () => {
  const { filteredVulnerabilities, loading, error } = useVulnerabilities();
  const [timeframe, setTimeframe] = useState<string>('week'); // week, month, quarter
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const slideData = useMemo(() => {
    if (!filteredVulnerabilities.length) return null;

    // Key metrics for executive summary
    const totalVulns = filteredVulnerabilities.length;
    const openVulns = filteredVulnerabilities.filter(v => v.status === 'Open' || v.status === 'Triaged').length;
    const criticalVulns = filteredVulnerabilities.filter(v => v.severity === 'Critical').length;
    const overdueVulns = filteredVulnerabilities.filter(v => v.days_overdue > 0).length;

    // Severity breakdown
    const severityBreakdown = filteredVulnerabilities.reduce((acc, vuln) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const severityChartData = Object.entries(severityBreakdown).map(([severity, count]) => ({
      name: severity,
      value: count,
      percentage: Math.round((count / totalVulns) * 100),
      color: {
        'Critical': '#ef4444',
        'High': '#f97316',
        'Medium': '#eab308',
        'Low': '#22c55e',
        'Info': '#3b82f6'
      }[severity] || '#6b7280'
    }));

    // Top 5 affected hosts
    const hostCounts = filteredVulnerabilities.reduce((acc, vuln) => {
      acc[vuln.host] = (acc[vuln.host] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topHosts = Object.entries(hostCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([host, count]) => ({
        host,
        vulnerabilities: count,
        critical: filteredVulnerabilities.filter(v => v.host === host && v.severity === 'Critical').length,
        percentage: Math.round((count / totalVulns) * 100)
      }));

    // Weekly trend for the chart
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const date = startOfWeek(subWeeks(new Date(), i));
      return {
        week: format(date, 'MMM dd'),
        date,
        discovered: 0,
        resolved: 0,
        net: 0
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
          weeks[weekIndex].discovered++;
          if (vuln.status === 'Fixed') {
            weeks[weekIndex].resolved++;
          }
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    weeks.forEach(week => {
      week.net = week.discovered - week.resolved;
    });

    // Risk metrics
    const riskScore = Math.round(
      (criticalVulns * 10 + severityBreakdown.High * 7 + severityBreakdown.Medium * 4 + 
       (severityBreakdown.Low || 0) * 2 + (severityBreakdown.Info || 0) * 1) / totalVulns
    );

    const complianceRate = totalVulns > 0 ? Math.round(((totalVulns - overdueVulns) / totalVulns) * 100) : 100;

    return {
      summary: {
        total: totalVulns,
        open: openVulns,
        critical: criticalVulns,
        overdue: overdueVulns,
        riskScore,
        complianceRate,
        closureRate: totalVulns > 0 ? Math.round(((totalVulns - openVulns) / totalVulns) * 100) : 0
      },
      severityChartData,
      topHosts,
      trendData: weeks
    };
  }, [filteredVulnerabilities]);

  const exportToCSV = () => {
    if (slideData && filteredVulnerabilities.length > 0) {
      CSVService.exportToCsv(filteredVulnerabilities, `vulnerability-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    }
  };

  const exportToExcel = () => {
    if (slideData && filteredVulnerabilities.length > 0) {
      CSVService.exportToExcel(filteredVulnerabilities, `vulnerability-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    }
  };

  const copyMetricsToClipboard = () => {
    if (!slideData) return;
    
    const metrics = `
Security Vulnerability Report - ${format(new Date(), 'MMMM dd, yyyy')}

EXECUTIVE SUMMARY:
• Total Vulnerabilities: ${slideData.summary.total}
• Open/Active: ${slideData.summary.open}
• Critical Severity: ${slideData.summary.critical}
• Overdue Items: ${slideData.summary.overdue}
• Risk Score: ${slideData.summary.riskScore}/10
• SLA Compliance: ${slideData.summary.complianceRate}%
• Closure Rate: ${slideData.summary.closureRate}%

SEVERITY BREAKDOWN:
${slideData.severityChartData.map(s => `• ${s.name}: ${s.value} (${s.percentage}%)`).join('\n')}

TOP AFFECTED HOSTS:
${slideData.topHosts.map((h, i) => `${i + 1}. ${h.host}: ${h.vulnerabilities} vulnerabilities (${h.critical} critical)`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(metrics);
  };

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

  if (error || !slideData) {
    return (
      <div className="text-center py-12">
        <Presentation className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Slide View Unavailable</h2>
        <p className="text-muted-foreground">{error || 'No data available for presentation'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Options */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Executive Security Report</h1>
          <p className="text-muted-foreground">Presentation-ready vulnerability overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyMetricsToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Summary
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Executive Summary Cards - Slide 1 */}
      <Card className="bg-gradient-to-r from-background to-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            Executive Summary - {format(new Date(), 'MMMM dd, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            <div className="text-center">
              <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold">{slideData.summary.total}</p>
              <p className="text-sm text-muted-foreground">Total Vulnerabilities</p>
            </div>
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-severity-critical mx-auto mb-2" />
              <p className="text-3xl font-bold text-severity-critical">{slideData.summary.critical}</p>
              <p className="text-sm text-muted-foreground">Critical Severity</p>
            </div>
            <div className="text-center">
              <Clock className="h-8 w-8 text-severity-high mx-auto mb-2" />
              <p className="text-3xl font-bold text-severity-high">{slideData.summary.overdue}</p>
              <p className="text-sm text-muted-foreground">Overdue Items</p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-cyber-success mx-auto mb-2" />
              <p className="text-3xl font-bold text-cyber-success">{slideData.summary.closureRate}%</p>
              <p className="text-sm text-muted-foreground">Closure Rate</p>
            </div>
            <div className="text-center">
              <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold ${
                slideData.summary.riskScore >= 8 ? 'bg-severity-critical' :
                slideData.summary.riskScore >= 6 ? 'bg-severity-high' :
                slideData.summary.riskScore >= 4 ? 'bg-severity-medium' : 'bg-cyber-success'
              }`}>
                {slideData.summary.riskScore}
              </div>
              <p className="text-3xl font-bold">{slideData.summary.riskScore}/10</p>
              <p className="text-sm text-muted-foreground">Risk Score</p>
            </div>
            <div className="text-center">
              <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold ${
                slideData.summary.complianceRate >= 90 ? 'bg-cyber-success' :
                slideData.summary.complianceRate >= 70 ? 'bg-severity-medium' : 'bg-severity-critical'
              }`}>
                %
              </div>
              <p className="text-3xl font-bold">{slideData.summary.complianceRate}%</p>
              <p className="text-sm text-muted-foreground">SLA Compliance</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold text-sm">{slideData.summary.open}</span>
              </div>
              <p className="text-3xl font-bold">{slideData.summary.open}</p>
              <p className="text-sm text-muted-foreground">Active Items</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts for Slides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution - Slide 2 */}
        <Card>
          <CardHeader>
            <CardTitle>Vulnerability Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={slideData.severityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percentage}) => `${name}\n${percentage}%`}
                  labelLine={false}
                >
                  {slideData.severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {slideData.severityChartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart - Slide 3 */}
        <Card>
          <CardHeader>
            <CardTitle>8-Week Vulnerability Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={slideData.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="discovered" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  name="Discovered"
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="resolved" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                  name="Resolved"
                  dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Net Change"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Affected Hosts - Slide 4 */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Most Affected Systems</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {slideData.topHosts.map((host, index) => (
              <div key={host.host} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/50 to-transparent border">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-lg">{host.host}</p>
                    <p className="text-sm text-muted-foreground">
                      {host.vulnerabilities} vulnerabilities ({host.percentage}% of total)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {host.vulnerabilities}
                  </Badge>
                  {host.critical > 0 && (
                    <Badge variant="destructive" className="text-sm px-2 py-1">
                      {host.critical} Critical
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Recommendations - Slide 5 */}
      <Card className="bg-gradient-to-r from-background to-accent/10">
        <CardHeader>
          <CardTitle>Key Recommendations & Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Immediate Actions</h3>
              <ul className="space-y-2">
                {slideData.summary.critical > 0 && (
                  <li className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-severity-critical mt-0.5" />
                    <span>Address {slideData.summary.critical} critical vulnerabilities immediately</span>
                  </li>
                )}
                {slideData.summary.overdue > 0 && (
                  <li className="flex items-start space-x-2">
                    <Clock className="h-5 w-5 text-severity-high mt-0.5" />
                    <span>Review {slideData.summary.overdue} overdue items for SLA compliance</span>
                  </li>
                )}
                <li className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <span>Focus remediation on top {slideData.topHosts.length} affected hosts</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Risk Posture:</span>
                  <Badge className={
                    slideData.summary.riskScore >= 8 ? 'bg-severity-critical' :
                    slideData.summary.riskScore >= 6 ? 'bg-severity-high' :
                    slideData.summary.riskScore >= 4 ? 'bg-severity-medium' : 'bg-cyber-success'
                  }>
                    {slideData.summary.riskScore >= 8 ? 'High Risk' :
                     slideData.summary.riskScore >= 6 ? 'Medium Risk' :
                     slideData.summary.riskScore >= 4 ? 'Low Risk' : 'Minimal Risk'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>SLA Compliance:</span>
                  <Badge className={slideData.summary.complianceRate >= 90 ? 'bg-cyber-success' : 'bg-severity-high'}>
                    {slideData.summary.complianceRate}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Closure Rate:</span>
                  <Badge className={slideData.summary.closureRate >= 70 ? 'bg-cyber-success' : 'bg-severity-medium'}>
                    {slideData.summary.closureRate}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SlideReadyView;