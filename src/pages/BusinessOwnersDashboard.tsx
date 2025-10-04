import { useState, useMemo } from 'react';
import { useVulnerabilities } from '@/hooks/useVulnerabilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { OwnerSummaryCards } from '@/components/business-owners/OwnerSummaryCards';
import { OwnerFilters } from '@/components/business-owners/OwnerFilters';
import { OwnerCharts } from '@/components/business-owners/OwnerCharts';
import { OwnerTable } from '@/components/business-owners/OwnerTable';
import { OwnerInsights } from '@/components/business-owners/OwnerInsights';

export interface OwnerFiltersState {
  searchTerm: string;
  severity: string[];
  status: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
}

const BusinessOwnersDashboard = () => {
  const { filteredVulnerabilities, loading, error } = useVulnerabilities();
  const [filters, setFilters] = useState<OwnerFiltersState>({
    searchTerm: '',
    severity: [],
    status: [],
    dateRange: {},
  });

  // Process owner data
  const ownerData = useMemo(() => {
    let vulnerabilities = [...filteredVulnerabilities];

    // Apply filters
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      vulnerabilities = vulnerabilities.filter(v => 
        v.owner?.toLowerCase().includes(search) ||
        v.host.toLowerCase().includes(search)
      );
    }

    if (filters.severity.length > 0) {
      vulnerabilities = vulnerabilities.filter(v =>
        filters.severity.includes(v.severity)
      );
    }

    if (filters.status.length > 0) {
      vulnerabilities = vulnerabilities.filter(v =>
        filters.status.includes(v.status)
      );
    }

    // Group by owner
    const ownerMap = new Map<string, any>();
    
    vulnerabilities.forEach(vuln => {
      const ownerKey = vuln.owner || 'Unassigned';
      
      if (!ownerMap.has(ownerKey)) {
        ownerMap.set(ownerKey, {
          owner: ownerKey,
          totalFindings: 0,
          openFindings: 0,
          fixedFindings: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          hosts: new Set<string>(),
          vulnerabilities: [],
        });
      }

      const ownerStats = ownerMap.get(ownerKey)!;
      ownerStats.totalFindings++;
      ownerStats.vulnerabilities.push(vuln);
      ownerStats.hosts.add(vuln.host.split(':')[0]);

      if (vuln.status.toLowerCase() === 'open') {
        ownerStats.openFindings++;
      } else if (vuln.status.toLowerCase() === 'fixed') {
        ownerStats.fixedFindings++;
      }

      const severity = vuln.severity.toLowerCase();
      if (severity === 'critical') ownerStats.criticalCount++;
      else if (severity === 'high') ownerStats.highCount++;
      else if (severity === 'medium') ownerStats.mediumCount++;
      else if (severity === 'low') ownerStats.lowCount++;
    });

    return Array.from(ownerMap.values()).map(owner => ({
      ...owner,
      hosts: Array.from(owner.hosts),
      fixRate: owner.totalFindings > 0 
        ? Math.round((owner.fixedFindings / owner.totalFindings) * 100) 
        : 0,
    })).sort((a, b) => b.totalFindings - a.totalFindings);
  }, [filteredVulnerabilities, filters]);

  const summary = useMemo(() => {
    const totalOwners = ownerData.filter(o => o.owner !== 'Unassigned').length;
    const unassignedFindings = ownerData.find(o => o.owner === 'Unassigned')?.totalFindings || 0;
    const totalFixed = ownerData.reduce((sum, o) => sum + o.fixedFindings, 0);
    const totalFindings = ownerData.reduce((sum, o) => sum + o.totalFindings, 0);
    const fixRate = totalFindings > 0 ? Math.round((totalFixed / totalFindings) * 100) : 0;

    return { totalOwners, unassignedFindings, totalFixed, fixRate };
  }, [ownerData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Owners Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track vulnerability metrics organized by business owners
        </p>
      </div>

      <OwnerSummaryCards summary={summary} />

      <OwnerFilters filters={filters} setFilters={setFilters} />

      <OwnerCharts ownerData={ownerData} />

      <OwnerTable ownerData={ownerData} />

      <OwnerInsights ownerData={ownerData} />
    </div>
  );
};

export default BusinessOwnersDashboard;
