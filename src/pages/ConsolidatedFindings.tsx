import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import VulnerabilityFilters from '@/components/filters/VulnerabilityFilters';
import VulnerabilityTable from '@/components/tables/VulnerabilityTable';
import { useVulnerabilities } from '@/hooks/useVulnerabilities';
import { useToast } from '@/hooks/use-toast';
import { Vulnerability } from '@/types/vulnerability';
import InternalHeader from '@/components/layout/InternalHeader';

const ConsolidatedFindings = () => {
  const { toast } = useToast();
  const {
    vulnerabilities,
    filteredVulnerabilities,
    filters,
    setFilters,
    loading,
    error,
    updateVulnerabilities,
  } = useVulnerabilities();

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

  if (loading) {
    return (
      <div className="min-h-screen w-full">
        <InternalHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading vulnerability data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full">
        <InternalHeader />
        <div className="px-4 md:px-6 lg:px-8 py-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const stats = {
    total: vulnerabilities.length,
    critical: vulnerabilities.filter(v => v.severity === 'Critical').length,
    high: vulnerabilities.filter(v => v.severity === 'High').length,
    open: vulnerabilities.filter(v => v.status === 'Open').length,
    overdue: vulnerabilities.filter(v => v.days_overdue > 0).length,
  };

  return (
    <div className="min-h-screen w-full">
      <InternalHeader />
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Consolidated Findings</h1>
          <p className="text-muted-foreground">
            Complete view of all security vulnerabilities across your infrastructure
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Findings</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
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
              <TrendingUp className="h-4 w-4 text-severity-high" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-severity-high">{stats.high}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertTriangle className="h-4 w-4 text-status-open" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-open">{stats.open}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <Users className="h-4 w-4 text-status-open" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-open">{stats.overdue}</div>
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

        {/* Table */}
        <VulnerabilityTable 
          vulnerabilities={filteredVulnerabilities} 
          onBulkUpdate={handleBulkUpdate}
        />
      </div>
    </div>
  );
};

export default ConsolidatedFindings;
