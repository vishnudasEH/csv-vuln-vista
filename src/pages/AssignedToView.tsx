import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useVulnerabilities } from '@/hooks/useVulnerabilities';
import VulnerabilityTable from '@/components/tables/VulnerabilityTable';
import { User, Users, AlertTriangle, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import InternalHeader from '@/components/layout/InternalHeader';

interface AssigneeMetrics {
  assignee: string;
  vulnerabilities: any[];
  total: number;
  open: number;
  closed: number;
  overdue: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  completionRate: number;
}

const AssignedToView = () => {
  const { filteredVulnerabilities, loading, error } = useVulnerabilities();
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('workload');

  const assigneeMetrics = useMemo((): AssigneeMetrics[] => {
    const grouped = filteredVulnerabilities.reduce((acc, vuln) => {
      const assignee = vuln.assigned_to || 'Unassigned';
      if (!acc[assignee]) {
        acc[assignee] = [];
      }
      acc[assignee].push(vuln);
      return acc;
    }, {} as Record<string, any[]>);

    const metrics = Object.entries(grouped).map(([assignee, vulnerabilities]) => {
      const total = vulnerabilities.length;
      const open = vulnerabilities.filter(v => v.status === 'Open' || v.status === 'In Progress').length;
      const closed = vulnerabilities.filter(v => v.status === 'Closed' || v.status === 'Resolved').length;
      const overdue = vulnerabilities.filter(v => v.days_overdue > 0).length;
      
      const severityCounts = vulnerabilities.reduce((counts, vuln) => {
        const severity = vuln.severity.toLowerCase();
        counts[severity] = (counts[severity] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      const completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

      return {
        assignee,
        vulnerabilities,
        total,
        open,
        closed,
        overdue,
        critical: severityCounts.critical || 0,
        high: severityCounts.high || 0,
        medium: severityCounts.medium || 0,
        low: severityCounts.low || 0,
        info: severityCounts.info || 0,
        completionRate
      };
    });

    return metrics.sort((a, b) => {
      switch (sortBy) {
        case 'overdue':
          return b.overdue - a.overdue;
        case 'completion':
          return b.completionRate - a.completionRate;
        case 'workload':
        default:
          return b.total - a.total;
      }
    });
  }, [filteredVulnerabilities, sortBy]);

  const summaryStats = useMemo(() => {
    const totalAssignees = assigneeMetrics.filter(m => m.assignee !== 'Unassigned').length;
    const unassignedCount = assigneeMetrics.find(m => m.assignee === 'Unassigned')?.total || 0;
    const totalOverdue = assigneeMetrics.reduce((sum, m) => sum + m.overdue, 0);
    const avgCompletionRate = assigneeMetrics.length > 0 
      ? Math.round(assigneeMetrics.reduce((sum, m) => sum + m.completionRate, 0) / assigneeMetrics.length)
      : 0;

    return { totalAssignees, unassignedCount, totalOverdue, avgCompletionRate };
  }, [assigneeMetrics]);

  const workloadChartData = useMemo(() => {
    return assigneeMetrics
      .filter(m => m.assignee !== 'Unassigned')
      .slice(0, 10)
      .map(m => ({
        assignee: m.assignee.length > 15 ? `${m.assignee.substring(0, 15)}...` : m.assignee,
        open: m.open,
        closed: m.closed,
        overdue: m.overdue
      }));
  }, [assigneeMetrics]);

  const filteredAssigneeData = useMemo(() => {
    if (selectedAssignee === 'all') {
      return assigneeMetrics;
    }
    return assigneeMetrics.filter(m => m.assignee === selectedAssignee);
  }, [assigneeMetrics, selectedAssignee]);

  if (loading) {
    return (
      <div className="min-h-screen w-full">
        <InternalHeader />
        <div className="px-4 md:px-6 lg:px-8 py-6">
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full">
        <InternalHeader />
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Assignee View Unavailable</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const getWorkloadColor = (metrics: AssigneeMetrics) => {
    if (metrics.overdue > 0) return 'text-severity-critical';
    if (metrics.open > 10) return 'text-severity-high';
    if (metrics.open > 5) return 'text-severity-medium';
    return 'text-cyber-success';
  };

  return (
    <div className="min-h-screen w-full">
      <InternalHeader />
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Team Workload & Assignments</h1>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workload">Sort by Workload</SelectItem>
                <SelectItem value="overdue">Sort by Overdue</SelectItem>
                <SelectItem value="completion">Sort by Completion Rate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {assigneeMetrics.map(m => (
                  <SelectItem key={m.assignee} value={m.assignee}>
                    {m.assignee} ({m.total})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Active Assignees</h3>
              </div>
              <p className="text-3xl font-bold mt-2">{summaryStats.totalAssignees}</p>
              <p className="text-sm text-muted-foreground">
                Team members with assignments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-severity-high" />
                <h3 className="font-medium">Unassigned</h3>
              </div>
              <p className="text-3xl font-bold mt-2 text-severity-high">{summaryStats.unassignedCount}</p>
              <p className="text-sm text-muted-foreground">
                Need assignment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-severity-critical" />
                <h3 className="font-medium">Total Overdue</h3>
              </div>
              <p className="text-3xl font-bold mt-2 text-severity-critical">{summaryStats.totalOverdue}</p>
              <p className="text-sm text-muted-foreground">
                Across all assignees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-cyber-success" />
                <h3 className="font-medium">Avg Completion</h3>
              </div>
              <p className="text-3xl font-bold mt-2 text-cyber-success">{summaryStats.avgCompletionRate}%</p>
              <p className="text-sm text-muted-foreground">
                Team average rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Workload Chart */}
        {workloadChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Team Workload Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={workloadChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="assignee" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="open" fill="hsl(var(--severity-high))" name="Open" />
                  <Bar dataKey="closed" fill="hsl(var(--cyber-success))" name="Closed" />
                  <Bar dataKey="overdue" fill="hsl(var(--severity-critical))" name="Overdue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Assignee Details */}
        <Card>
          <CardHeader>
            <CardTitle>Assignee Details & Workloads</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredAssigneeData.map((assigneeData) => (
                <AccordionItem key={assigneeData.assignee} value={assigneeData.assignee}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {assigneeData.assignee === 'Unassigned' ? (
                            <User className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <User className="h-5 w-5 text-primary" />
                          )}
                          <span className="font-medium">{assigneeData.assignee}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="secondary">{assigneeData.total} total</Badge>
                          {assigneeData.open > 0 && (
                            <Badge variant="destructive">{assigneeData.open} open</Badge>
                          )}
                          {assigneeData.overdue > 0 && (
                            <Badge className="bg-severity-critical text-white">
                              {assigneeData.overdue} overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className={getWorkloadColor(assigneeData)}>
                          {assigneeData.completionRate}% completed
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-3 rounded-lg bg-severity-critical/10">
                          <p className="text-2xl font-bold text-severity-critical">{assigneeData.critical}</p>
                          <p className="text-xs text-muted-foreground">Critical</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-severity-high/10">
                          <p className="text-2xl font-bold text-severity-high">{assigneeData.high}</p>
                          <p className="text-xs text-muted-foreground">High</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-severity-medium/10">
                          <p className="text-2xl font-bold text-severity-medium">{assigneeData.medium}</p>
                          <p className="text-xs text-muted-foreground">Medium</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-severity-low/10">
                          <p className="text-2xl font-bold text-severity-low">{assigneeData.low}</p>
                          <p className="text-xs text-muted-foreground">Low</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold">{assigneeData.info}</p>
                          <p className="text-xs text-muted-foreground">Info</p>
                        </div>
                      </div>

                      {/* Vulnerability Table */}
                      <VulnerabilityTable vulnerabilities={assigneeData.vulnerabilities} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssignedToView;
