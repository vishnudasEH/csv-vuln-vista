import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useVulnerabilities } from '@/hooks/useVulnerabilities';
import VulnerabilityTable from '@/components/tables/VulnerabilityTable';
import { AlertTriangle, Clock, TrendingUp, Filter } from 'lucide-react';
import { VulnerabilitySeverity, VulnerabilityStatus } from '@/types/vulnerability';

const SlaTracker = () => {
  const { filteredVulnerabilities, loading, error } = useVulnerabilities();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('open-only');
  const [hostFilter, setHostFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // SLA Thresholds (configurable)
  const slaThresholds = {
    'Critical': 1, // 1 day
    'High': 7,     // 7 days
    'Medium': 30,  // 30 days
    'Low': 90,     // 90 days
    'Info': 180    // 180 days
  };

  const filteredOverdueVulns = useMemo(() => {
    let vulns = filteredVulnerabilities.filter(v => {
      // Only show overdue items or items approaching SLA
      const threshold = slaThresholds[v.severity as keyof typeof slaThresholds] || 30;
      return v.days_overdue > 0 || v.days_overdue >= threshold * 0.8; // 80% of threshold
    });

    // Apply additional filters
    if (severityFilter !== 'all') {
      vulns = vulns.filter(v => v.severity === severityFilter);
    }

    if (statusFilter === 'open-only') {
      vulns = vulns.filter(v => v.status === 'Open' || v.status === 'In Progress');
    } else if (statusFilter !== 'all') {
      vulns = vulns.filter(v => v.status === statusFilter);
    }

    if (hostFilter) {
      vulns = vulns.filter(v => v.host.toLowerCase().includes(hostFilter.toLowerCase()));
    }

    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned') {
        vulns = vulns.filter(v => !v.assigned_to || v.assigned_to.trim() === '');
      } else {
        vulns = vulns.filter(v => v.assigned_to === assigneeFilter);
      }
    }

    return vulns.sort((a, b) => {
      // Sort by severity priority first, then by days overdue
      const severityOrder = { 'Critical': 5, 'High': 4, 'Medium': 3, 'Low': 2, 'Info': 1 };
      const aSeverity = severityOrder[a.severity as keyof typeof severityOrder] || 0;
      const bSeverity = severityOrder[b.severity as keyof typeof severityOrder] || 0;
      
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity;
      }
      
      return b.days_overdue - a.days_overdue;
    });
  }, [filteredVulnerabilities, severityFilter, statusFilter, hostFilter, assigneeFilter]);

  const slaMetrics = useMemo(() => {
    const breached = filteredVulnerabilities.filter(v => {
      const threshold = slaThresholds[v.severity as keyof typeof slaThresholds] || 30;
      return v.days_overdue > threshold;
    });

    const atRisk = filteredVulnerabilities.filter(v => {
      const threshold = slaThresholds[v.severity as keyof typeof slaThresholds] || 30;
      return v.days_overdue > 0 && v.days_overdue <= threshold && v.days_overdue >= threshold * 0.8;
    });

    const criticalBreached = breached.filter(v => v.severity === 'Critical').length;
    const highBreached = breached.filter(v => v.severity === 'High').length;

    const assigneeBreaches = breached.reduce((acc, vuln) => {
      const assignee = vuln.assigned_to || 'Unassigned';
      acc[assignee] = (acc[assignee] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topBreaches = Object.entries(assigneeBreaches)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      totalBreached: breached.length,
      atRisk: atRisk.length,
      criticalBreached,
      highBreached,
      topBreaches
    };
  }, [filteredVulnerabilities]);

  // Get unique values for filters
  const uniqueAssignees = useMemo(() => {
    const assignees = [...new Set(filteredVulnerabilities.map(v => v.assigned_to).filter(Boolean))];
    return assignees.sort();
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

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">SLA Tracker Unavailable</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const getSlaStatus = (vuln: any) => {
    const threshold = slaThresholds[vuln.severity as keyof typeof slaThresholds] || 30;
    
    if (vuln.days_overdue > threshold) {
      return { status: 'breached', color: 'text-severity-critical', label: 'SLA Breached' };
    }
    
    if (vuln.days_overdue >= threshold * 0.8) {
      return { status: 'at-risk', color: 'text-severity-high', label: 'At Risk' };
    }
    
    return { status: 'on-track', color: 'text-cyber-success', label: 'On Track' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">SLA & Overdue Tracker</h1>
        <Badge variant="secondary" className="text-sm">
          {filteredOverdueVulns.length} Items Need Attention
        </Badge>
      </div>

      {/* SLA Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-severity-critical" />
              <h3 className="font-medium">SLA Breached</h3>
            </div>
            <p className="text-3xl font-bold mt-2 text-severity-critical">{slaMetrics.totalBreached}</p>
            <p className="text-sm text-muted-foreground">
              {slaMetrics.criticalBreached} critical, {slaMetrics.highBreached} high
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-severity-high" />
              <h3 className="font-medium">At Risk</h3>
            </div>
            <p className="text-3xl font-bold mt-2 text-severity-high">{slaMetrics.atRisk}</p>
            <p className="text-sm text-muted-foreground">
              Approaching SLA deadline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Compliance Rate</h3>
            </div>
            <p className="text-3xl font-bold mt-2">
              {filteredVulnerabilities.length > 0 
                ? Math.round(((filteredVulnerabilities.length - slaMetrics.totalBreached) / filteredVulnerabilities.length) * 100)
                : 100}%
            </p>
            <p className="text-sm text-muted-foreground">
              Within SLA thresholds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Filtered Results</h3>
            </div>
            <p className="text-3xl font-bold mt-2">{filteredOverdueVulns.length}</p>
            <p className="text-sm text-muted-foreground">
              Matching current filters
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SLA Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(slaThresholds).map(([severity, days]) => (
              <div key={severity} className="text-center p-3 rounded-lg bg-muted/50">
                <Badge className={`mb-2 ${
                  severity === 'Critical' ? 'bg-severity-critical' :
                  severity === 'High' ? 'bg-severity-high' :
                  severity === 'Medium' ? 'bg-severity-medium' :
                  severity === 'Low' ? 'bg-severity-low' : 'bg-severity-info'
                } text-white`}>
                  {severity}
                </Badge>
                <p className="text-sm font-medium">{days} days</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Assignees with SLA Breaches */}
      {slaMetrics.topBreaches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Assignees with SLA Breaches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {slaMetrics.topBreaches.map(([assignee, count]) => (
                <div key={assignee} className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="font-medium truncate">{assignee}</p>
                  <p className="text-2xl font-bold text-severity-critical">{count}</p>
                  <p className="text-xs text-muted-foreground">breached</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open-only">Open Only</SelectItem>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Assigned To</label>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {uniqueAssignees.map(assignee => (
                    <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Host Filter</label>
              <Input
                placeholder="Filter by host..."
                value={hostFilter}
                onChange={(e) => setHostFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Vulnerability Table with SLA Status */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue & At-Risk Vulnerabilities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredOverdueVulns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No vulnerabilities match the current filters.</p>
              <p className="text-sm">All items are within SLA thresholds.</p>
            </div>
          ) : (
            <VulnerabilityTable vulnerabilities={filteredOverdueVulns} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SlaTracker;