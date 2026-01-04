import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle2, Shield, Cloud, RotateCcw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cloudflareService, CloudflareVulnerability, CloudflareSummary, CloudflareFilters } from '@/services/cloudflareService';
import { Skeleton } from '@/components/ui/skeleton';
import { usePagination } from '@/hooks/usePagination';
import CloudflareHeader from '@/components/layout/CloudflareHeader';
import { CloudflareExportDialog } from '@/components/cloudflare/CloudflareExportDialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

/**
 * Cloudflare Dashboard
 * 
 * Full-featured vulnerability management dashboard for Cloudflare module.
 * Features:
 * - Summary cards showing total, fixed, and severity breakdown
 * - Filterable vulnerability table with pagination (10 per page)
 * - Multi-select with checkboxes
 * - Bulk actions (status update, retest)
 * - Export functionality (CSV, Excel)
 * - Inline editing for Status and Notes
 */

const CloudflareDashboard = () => {
  const { toast } = useToast();

  // Data state
  const [vulnerabilities, setVulnerabilities] = useState<CloudflareVulnerability[]>([]);
  const [summary, setSummary] = useState<CloudflareSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<CloudflareFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Editing state
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [savingRow, setSavingRow] = useState<string | null>(null);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [vulnData, summaryData] = await Promise.all([
        cloudflareService.getVulnerabilities(filters),
        cloudflareService.getSummary(),
      ]);
      
      setVulnerabilities(vulnData);
      setSummary(summaryData);
      setSelectedRows(new Set()); // Clear selection on data refresh
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
  }, [filters, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter vulnerabilities by search term (client-side)
  const filteredVulnerabilities = vulnerabilities.filter(v => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      v.domain.toLowerCase().includes(search) ||
      v.vulnerability_name.toLowerCase().includes(search)
    );
  });

  // Pagination (10 items per page)
  const {
    paginatedData: paginatedVulnerabilities,
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage,
    hasPrevPage,
  } = usePagination(filteredVulnerabilities, { pageSize: 10, initialPage: 1 });

  // Row key helper
  const getRowKey = (vuln: CloudflareVulnerability) => `${vuln.domain}-${vuln.vulnerability_name}`;

  // Selection handlers
  const toggleRowSelection = (vuln: CloudflareVulnerability) => {
    const key = getRowKey(vuln);
    const newSelected = new Set(selectedRows);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedVulnerabilities.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedVulnerabilities.map(getRowKey)));
    }
  };

  const getSelectedVulnerabilities = () => {
    return filteredVulnerabilities.filter(v => selectedRows.has(getRowKey(v)));
  };

  // Handle status change
  const handleStatusChange = async (vuln: CloudflareVulnerability, newStatus: string) => {
    const rowKey = getRowKey(vuln);
    setSavingRow(rowKey);
    
    try {
      await cloudflareService.updateSingleVulnerability(
        vuln.domain,
        vuln.vulnerability_name,
        { status: newStatus }
      );
      
      setVulnerabilities(prev => 
        prev.map(v => 
          v.domain === vuln.domain && v.vulnerability_name === vuln.vulnerability_name
            ? { ...v, status: newStatus as CloudflareVulnerability['status'] }
            : v
        )
      );
      
      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
      
      const newSummary = await cloudflareService.getSummary();
      setSummary(newSummary);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setSavingRow(null);
    }
  };

  // Handle notes save
  const handleNotesSave = async (vuln: CloudflareVulnerability) => {
    const rowKey = getRowKey(vuln);
    setSavingRow(rowKey);
    
    try {
      await cloudflareService.updateSingleVulnerability(
        vuln.domain,
        vuln.vulnerability_name,
        { notes: editingNotes }
      );
      
      setVulnerabilities(prev => 
        prev.map(v => 
          v.domain === vuln.domain && v.vulnerability_name === vuln.vulnerability_name
            ? { ...v, notes: editingNotes }
            : v
        )
      );
      
      setEditingRow(null);
      setEditingNotes('');
      
      toast({
        title: 'Success',
        description: 'Notes updated successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update notes',
        variant: 'destructive',
      });
    } finally {
      setSavingRow(null);
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus: string) => {
    const selected = getSelectedVulnerabilities();
    if (selected.length === 0) return;

    try {
      const updates = selected.map(v => ({
        Domain: v.domain,
        'Vulnerability Name': v.vulnerability_name,
        Status: newStatus,
      }));

      await cloudflareService.updateVulnerabilities(updates);
      
      setVulnerabilities(prev => 
        prev.map(v => 
          selectedRows.has(getRowKey(v))
            ? { ...v, status: newStatus as CloudflareVulnerability['status'] }
            : v
        )
      );
      
      toast({
        title: 'Success',
        description: `Updated ${selected.length} vulnerabilities`,
      });
      
      setSelectedRows(new Set());
      const newSummary = await cloudflareService.getSummary();
      setSummary(newSummary);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update vulnerabilities',
        variant: 'destructive',
      });
    }
  };

  // Retest handler (placeholder)
  const handleRetest = () => {
    const selected = getSelectedVulnerabilities();
    toast({
      title: 'Retest Initiated',
      description: `Retest requested for ${selected.length} vulnerabilities. Backend integration pending.`,
    });
  };

  // Severity badge colors
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'high': return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      case 'low': return 'bg-green-500 hover:bg-green-600 text-white';
      default: return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'fixed': return 'bg-green-100 text-green-800 border-green-300';
      case 'open': return 'bg-red-100 text-red-800 border-red-300';
      case 'accepted risk': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get unique domains for filter
  const uniqueDomains = [...new Set(vulnerabilities.map(v => v.domain))];

  return (
    <div className="min-h-screen w-full">
      <CloudflareHeader />
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="h-6 w-6 text-orange-500" />
              <h1 className="text-2xl md:text-3xl font-bold">Cloudflare Dashboard</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Manage DNS and security vulnerabilities from Cloudflare scans
            </p>
          </div>
          <div className="flex gap-2">
            <CloudflareExportDialog 
              vulnerabilities={filteredVulnerabilities}
              selectedVulnerabilities={getSelectedVulnerabilities()}
            />
            <Button onClick={fetchData} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{summary?.total_vulnerabilities || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Fixed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{summary?.fixed_vulnerabilities || 0}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">{summary?.severity_counts?.critical || 0}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">High</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600">{summary?.severity_counts?.high || 0}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Medium</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-600">{summary?.severity_counts?.medium || 0}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Low</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{summary?.severity_counts?.low || 0}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input
                placeholder="Search domain or vulnerability..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />

              <Select
                value={filters.domain || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, domain: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {uniqueDomains.map(domain => (
                    <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.severity || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Fixed">Fixed</SelectItem>
                  <SelectItem value="Accepted Risk">Accepted Risk</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setFilters({});
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedRows.size > 0 && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="py-3">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-medium">{selectedRows.size} selected</span>
                
                <Select onValueChange={handleBulkStatusUpdate}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Bulk Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Set Open</SelectItem>
                    <SelectItem value="Fixed">Set Fixed</SelectItem>
                    <SelectItem value="Accepted Risk">Set Accepted Risk</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" onClick={handleRetest}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retest Selected
                </Button>

                <Button variant="ghost" size="sm" onClick={() => setSelectedRows(new Set())}>
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchData} className="ml-auto">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Vulnerability Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Vulnerabilities ({filteredVulnerabilities.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedRows.size === paginatedVulnerabilities.length && paginatedVulnerabilities.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="min-w-[150px]">Domain</TableHead>
                    <TableHead className="min-w-[200px]">Vulnerability Name</TableHead>
                    <TableHead className="min-w-[100px]">Severity</TableHead>
                    <TableHead className="min-w-[140px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">First Observed</TableHead>
                    <TableHead className="min-w-[120px]">Last Observed</TableHead>
                    <TableHead className="min-w-[80px]">Aging (Days)</TableHead>
                    <TableHead className="min-w-[150px]">Business Owner</TableHead>
                    <TableHead className="min-w-[250px]">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        {Array(10).fill(0).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : paginatedVulnerabilities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No vulnerabilities found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedVulnerabilities.map((vuln) => {
                      const rowKey = getRowKey(vuln);
                      const isEditing = editingRow === rowKey;
                      const isSaving = savingRow === rowKey;
                      const isSelected = selectedRows.has(rowKey);

                      return (
                        <TableRow key={rowKey} className={`${isSaving ? 'opacity-50' : ''} ${isSelected ? 'bg-primary/5' : ''}`}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleRowSelection(vuln)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{vuln.domain}</TableCell>
                          <TableCell>{vuln.vulnerability_name}</TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(vuln.severity)}>
                              {vuln.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={vuln.status}
                              onValueChange={(value) => handleStatusChange(vuln, value)}
                              disabled={isSaving}
                            >
                              <SelectTrigger className={`w-[130px] ${getStatusColor(vuln.status)}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Open">Open</SelectItem>
                                <SelectItem value="Fixed">Fixed</SelectItem>
                                <SelectItem value="Accepted Risk">Accepted Risk</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{vuln.first_observed}</TableCell>
                          <TableCell>{vuln.last_observed}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={vuln.aging_days > 30 ? 'destructive' : 'secondary'}>
                              {vuln.aging_days}
                            </Badge>
                          </TableCell>
                          <TableCell>{vuln.business_owner}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Textarea
                                  value={editingNotes}
                                  onChange={(e) => setEditingNotes(e.target.value)}
                                  className="min-h-[60px] text-sm"
                                  disabled={isSaving}
                                />
                                <div className="flex flex-col gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleNotesSave(vuln)}
                                    disabled={isSaving}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingRow(null);
                                      setEditingNotes('');
                                    }}
                                    disabled={isSaving}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted p-2 rounded min-h-[40px] text-sm"
                                onClick={() => {
                                  setEditingRow(rowKey);
                                  setEditingNotes(vuln.notes || '');
                                }}
                                title="Click to edit notes"
                              >
                                {vuln.notes || <span className="text-muted-foreground italic">Click to add notes...</span>}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={goToPrevPage}
                    className={!hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const showPage = page === 1 || 
                                  page === totalPages || 
                                  (page >= currentPage - 1 && page <= currentPage + 1);
                  
                  const showEllipsis = (page === 2 && currentPage > 3) || 
                                      (page === totalPages - 1 && currentPage < totalPages - 2);

                  if (showEllipsis) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  if (!showPage) return null;

                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => goToPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext 
                    onClick={goToNextPage}
                    className={!hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudflareDashboard;
