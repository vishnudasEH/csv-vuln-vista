import { useState, useEffect, useCallback, useMemo } from 'react';
import { Shield, AlertTriangle, FileText, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import CloudflareHeader from '@/components/layout/CloudflareHeader';
import { CloudflareVulnerabilityDialog } from '@/components/cloudflare/CloudflareVulnerabilityDialog';
import { CloudflareRetestDialog } from '@/components/cloudflare/CloudflareRetestDialog';
import { cloudflareService, CloudflareVulnerability, CloudflareRetestResult } from '@/services/cloudflareService';
import { useToast } from '@/hooks/use-toast';

/**
 * Cloudflare Vulnerabilities Page
 * Groups vulnerabilities by title similar to Internal Scans vulnerability page
 */

const CloudflareVulnerabilitiesPage = () => {
  const { toast } = useToast();
  const [vulnerabilities, setVulnerabilities] = useState<CloudflareVulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Open'); // Default to Open

  // Retest state
  const [retestDialogOpen, setRetestDialogOpen] = useState(false);
  const [retestResults, setRetestResults] = useState<CloudflareRetestResult[]>([]);
  const [isRetesting, setIsRetesting] = useState(false);
  const [retestTotal, setRetestTotal] = useState(0);
  const [retestCompleted, setRetestCompleted] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cloudflareService.getVulnerabilities();
      setVulnerabilities(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter vulnerabilities
  const filteredVulnerabilities = useMemo(() => {
    return vulnerabilities.filter(v => {
      // Status filter
      if (statusFilter && statusFilter !== 'all') {
        if (v.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!v.vulnerability_name.toLowerCase().includes(search) &&
            !v.domain.toLowerCase().includes(search)) {
          return false;
        }
      }
      return true;
    });
  }, [vulnerabilities, statusFilter, searchTerm]);

  // Group vulnerabilities by name (similar to internal scans)
  const groupedVulnerabilities = useMemo(() => {
    const groups: Record<string, {
      name: string;
      description: string | null;
      findings: CloudflareVulnerability[];
      totalCount: number;
      criticalCount: number;
      highCount: number;
      mediumCount: number;
      lowCount: number;
      openCount: number;
      maxSeverity: string;
    }> = {};

    filteredVulnerabilities.forEach(vuln => {
      const name = vuln.vulnerability_name;
      if (!groups[name]) {
        groups[name] = {
          name,
          description: vuln.description || null,
          findings: [],
          totalCount: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          openCount: 0,
          maxSeverity: vuln.severity,
        };
      }

      groups[name].findings.push(vuln);
      groups[name].totalCount++;

      const severity = vuln.severity?.toLowerCase();
      if (severity === 'critical') groups[name].criticalCount++;
      else if (severity === 'high') groups[name].highCount++;
      else if (severity === 'medium') groups[name].mediumCount++;
      else if (severity === 'low') groups[name].lowCount++;

      if (vuln.status?.toLowerCase() === 'open') groups[name].openCount++;

      // Track max severity
      const severityOrder: Record<string, number> = { 'critical': 5, 'high': 4, 'medium': 3, 'low': 2, 'unknown': 1 };
      const currentSeverity = vuln.severity?.toLowerCase() || 'unknown';
      const maxSeverity = groups[name].maxSeverity?.toLowerCase() || 'unknown';
      if ((severityOrder[currentSeverity] || 0) > (severityOrder[maxSeverity] || 0)) {
        groups[name].maxSeverity = vuln.severity;
      }
    });

    // Sort by max severity then by count
    return Object.values(groups).sort((a, b) => {
      const severityOrder: Record<string, number> = { 'critical': 5, 'high': 4, 'medium': 3, 'low': 2, 'unknown': 1 };
      const aSeverity = a.maxSeverity?.toLowerCase() || 'unknown';
      const bSeverity = b.maxSeverity?.toLowerCase() || 'unknown';
      const severityDiff = (severityOrder[bSeverity] || 0) - (severityOrder[aSeverity] || 0);
      return severityDiff !== 0 ? severityDiff : b.totalCount - a.totalCount;
    });
  }, [filteredVulnerabilities]);

  // Handle vulnerability update
  const handleVulnerabilityUpdate = async (
    domain: string,
    vulnName: string,
    updates: { status?: string; notes?: string }
  ) => {
    await cloudflareService.updateSingleVulnerability(domain, vulnName, updates);
    setVulnerabilities(prev =>
      prev.map(v =>
        v.domain === domain && v.vulnerability_name === vulnName
          ? {
              ...v,
              status: updates.status ? updates.status as CloudflareVulnerability['status'] : v.status,
              notes: updates.notes !== undefined ? updates.notes : v.notes
            }
          : v
      )
    );
  };

  // Handle single retest
  const handleSingleRetest = async (vuln: CloudflareVulnerability) => {
    setRetestResults([]);
    setRetestTotal(1);
    setRetestCompleted(0);
    setIsRetesting(true);
    setRetestDialogOpen(true);

    const result = await cloudflareService.retestVulnerability(vuln.domain, vuln.vulnerability_name);
    setRetestResults([result]);
    setRetestCompleted(1);
    setIsRetesting(false);

    if (result.success && result.status) {
      setVulnerabilities(prev =>
        prev.map(v =>
          v.domain === vuln.domain && v.vulnerability_name === vuln.vulnerability_name
            ? { ...v, status: result.status as CloudflareVulnerability['status'] }
            : v
        )
      );
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-severity-critical/15 text-severity-critical border-severity-critical/30';
      case 'high': return 'bg-severity-high/15 text-severity-high border-severity-high/30';
      case 'medium': return 'bg-severity-medium/15 text-severity-medium border-severity-medium/30';
      case 'low': return 'bg-severity-low/15 text-severity-low border-severity-low/30';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  // Summary stats
  const stats = {
    uniqueVulns: groupedVulnerabilities.length,
    totalFindings: filteredVulnerabilities.length,
    critical: filteredVulnerabilities.filter(v => v.severity?.toLowerCase() === 'critical').length,
    high: filteredVulnerabilities.filter(v => v.severity?.toLowerCase() === 'high').length,
    open: filteredVulnerabilities.filter(v => v.status?.toLowerCase() === 'open').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full">
        <CloudflareHeader />
        <div className="px-4 md:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
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
        <CloudflareHeader />
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <CloudflareHeader />
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-orange-500" />
            <h1 className="text-2xl md:text-3xl font-bold">Unique Vulnerabilities</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Grouped vulnerability titles with associated findings
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Vulnerabilities</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueVulns}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Findings</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFindings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-severity-critical" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-severity-critical">{stats.critical}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High</CardTitle>
              <AlertTriangle className="h-4 w-4 text-severity-high" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-severity-high">{stats.high}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Status</CardTitle>
              <Clock className="h-4 w-4 text-status-open" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-open">{stats.open}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Input
                placeholder="Search vulnerability or domain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Fixed">Fixed</SelectItem>
                  <SelectItem value="Work in Progress">Work in Progress</SelectItem>
                  <SelectItem value="Accepted Risk">Accepted Risk</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('Open');
                }}
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vulnerability List */}
        <Card>
          <CardHeader>
            <CardTitle>Unique Vulnerability Types</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {groupedVulnerabilities.map((vulnGroup) => (
                <div key={vulnGroup.name} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          variant="outline"
                          className={`font-medium border ${getSeverityStyle(vulnGroup.maxSeverity)}`}
                        >
                          {vulnGroup.maxSeverity || 'Unknown'}
                        </Badge>
                        <h3 className="font-medium text-lg truncate">{vulnGroup.name}</h3>
                      </div>
                      {vulnGroup.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {vulnGroup.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{vulnGroup.totalCount} findings</span>
                        {vulnGroup.criticalCount > 0 && (
                          <span className="text-severity-critical">
                            {vulnGroup.criticalCount} critical
                          </span>
                        )}
                        {vulnGroup.highCount > 0 && (
                          <span className="text-severity-high">
                            {vulnGroup.highCount} high
                          </span>
                        )}
                        {vulnGroup.openCount > 0 && (
                          <span className="text-status-open">
                            {vulnGroup.openCount} open
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <CloudflareVulnerabilityDialog
                        vulnerability={vulnGroup.findings[0]}
                        onUpdate={handleVulnerabilityUpdate}
                        onRetest={handleSingleRetest}
                      >
                        <Button variant="outline" size="sm" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          View {vulnGroup.totalCount} Finding{vulnGroup.totalCount !== 1 ? 's' : ''}
                        </Button>
                      </CloudflareVulnerabilityDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {groupedVulnerabilities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No vulnerabilities match the current filters.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Retest Dialog */}
      <CloudflareRetestDialog
        open={retestDialogOpen}
        onOpenChange={setRetestDialogOpen}
        results={retestResults}
        isRunning={isRetesting}
        total={retestTotal}
        completed={retestCompleted}
      />
    </div>
  );
};

export default CloudflareVulnerabilitiesPage;
