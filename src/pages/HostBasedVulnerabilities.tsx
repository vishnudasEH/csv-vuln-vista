import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Loader2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight, 
  Server,
  Shield,
  Activity,
} from 'lucide-react';
import VulnerabilityFilters from '@/components/filters/VulnerabilityFilters';
import VulnerabilityTable from '@/components/tables/VulnerabilityTable';
import SeverityBadge from '@/components/ui/severity-badge';
import { useVulnerabilities } from '@/hooks/useVulnerabilities';
import { useToast } from '@/hooks/use-toast';
import { Vulnerability } from '@/types/vulnerability';

const HostBasedVulnerabilities = () => {
  const { toast } = useToast();
  const {
    hostGroups,
    vulnerabilities,
    filteredVulnerabilities,
    filters,
    setFilters,
    loading,
    error,
    updateVulnerabilities,
  } = useVulnerabilities();

  const [expandedHosts, setExpandedHosts] = useState<Set<string>>(new Set());

  const handleBulkUpdate = async (updates: Array<{name: string, host: string} & Partial<Vulnerability>>) => {
    try {
      await updateVulnerabilities(updates);
      toast({
        title: "Success",
        description: `Updated ${updates.length} vulnerabilities in the master CSV file.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update vulnerabilities. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleHost = (host: string) => {
    const newExpanded = new Set(expandedHosts);
    if (newExpanded.has(host)) {
      newExpanded.delete(host);
    } else {
      newExpanded.add(host);
    }
    setExpandedHosts(newExpanded);
  };

  const expandAll = () => {
    setExpandedHosts(new Set(hostGroups.map(group => group.host)));
  };

  const collapseAll = () => {
    setExpandedHosts(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading vulnerability data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  const stats = {
    totalHosts: hostGroups.length,
    totalVulns: filteredVulnerabilities.length,
    criticalHosts: hostGroups.filter(g => g.criticalCount > 0).length,
    highRiskHosts: hostGroups.filter(g => g.criticalCount > 0 || g.highCount > 0).length,
  };

  return (
    <div className="min-h-screen w-full p-4 md:p-6 lg:p-8">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Host-Based Vulnerabilities</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Vulnerabilities organized by affected hosts for targeted remediation
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hosts</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHosts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vulnerabilities</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVulns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Hosts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-severity-critical" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-severity-critical">{stats.criticalHosts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Hosts</CardTitle>
            <Activity className="h-4 w-4 text-severity-high" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-severity-high">{stats.highRiskHosts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <VulnerabilityFilters
        vulnerabilities={vulnerabilities}
        filteredVulnerabilities={filteredVulnerabilities}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Expand/Collapse Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
        <Badge variant="secondary">
          {hostGroups.length} hosts with vulnerabilities
        </Badge>
      </div>

      {/* Host Groups */}
      <div className="space-y-4">
        {hostGroups.map((hostGroup) => (
          <Card key={hostGroup.host}>
            <Collapsible
              open={expandedHosts.has(hostGroup.host)}
              onOpenChange={() => toggleHost(hostGroup.host)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {expandedHosts.has(hostGroup.host) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <div>
                        <CardTitle className="flex items-center">
                          <Server className="h-5 w-5 mr-2" />
                          {hostGroup.host}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {hostGroup.count} vulnerabilities
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hostGroup.criticalCount > 0 && (
                        <SeverityBadge severity="Critical" />
                      )}
                      {hostGroup.highCount > 0 && (
                        <SeverityBadge severity="High" />
                      )}
                      {hostGroup.mediumCount > 0 && (
                        <SeverityBadge severity="Medium" />
                      )}
                      {hostGroup.lowCount > 0 && (
                        <SeverityBadge severity="Low" />
                      )}
                      {hostGroup.count > 0 && (
                        <Badge variant="outline">
                          {hostGroup.count} total
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-2 md:px-6">
                  <VulnerabilityTable 
                    vulnerabilities={hostGroup.vulnerabilities} 
                    onBulkUpdate={handleBulkUpdate}
                    pageSize={50}
                  />
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

        {hostGroups.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No hosts match the current filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HostBasedVulnerabilities;