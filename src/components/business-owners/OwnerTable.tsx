import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Mail, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OwnerDetailsDialog } from './OwnerDetailsDialog';
import { CSVService } from '@/services/csvService';
import { toast } from 'sonner';

interface OwnerTableProps {
  ownerData: any[];
}

export const OwnerTable = ({ ownerData }: OwnerTableProps) => {
  const [selectedOwners, setSelectedOwners] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(ownerData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = ownerData.slice(startIndex, endIndex);

  const toggleOwner = (owner: string) => {
    const newSelected = new Set(selectedOwners);
    if (newSelected.has(owner)) {
      newSelected.delete(owner);
    } else {
      newSelected.add(owner);
    }
    setSelectedOwners(newSelected);
  };

  const toggleAll = () => {
    if (selectedOwners.size === currentData.length) {
      setSelectedOwners(new Set());
    } else {
      setSelectedOwners(new Set(currentData.map(o => o.owner)));
    }
  };

  const exportSelected = () => {
    const selectedData = ownerData.filter(o => selectedOwners.has(o.owner));
    const vulnerabilities = selectedData.flatMap(o => o.vulnerabilities);
    
    if (vulnerabilities.length === 0) {
      toast.error('No data to export');
      return;
    }

    CSVService.exportToCsv(vulnerabilities, `business-owners-${Date.now()}.csv`);
    toast.success(`Exported ${vulnerabilities.length} findings from ${selectedData.length} owners`);
  };

  const getSeverityColor = (count: number, type: string) => {
    if (count === 0) return 'text-muted-foreground';
    switch (type) {
      case 'critical': return 'text-severity-critical font-semibold';
      case 'high': return 'text-severity-high font-semibold';
      case 'medium': return 'text-severity-medium font-semibold';
      case 'low': return 'text-severity-low font-semibold';
      default: return '';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Business Owners Overview</CardTitle>
            <div className="flex gap-2">
              {selectedOwners.size > 0 && (
                <Button variant="outline" size="sm" onClick={exportSelected}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected ({selectedOwners.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedOwners.size === currentData.length && currentData.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Business Owner</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">C / H / M / L</TableHead>
                  <TableHead className="text-center">Open</TableHead>
                  <TableHead className="text-center">Fixed</TableHead>
                  <TableHead className="text-center">Fix Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((owner) => (
                  <TableRow key={owner.owner}>
                    <TableCell>
                      <Checkbox
                        checked={selectedOwners.has(owner.owner)}
                        onCheckedChange={() => toggleOwner(owner.owner)}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setSelectedOwner(owner)}
                        className="text-primary hover:underline font-medium text-left"
                      >
                        {owner.owner}
                      </button>
                      <div className="text-xs text-muted-foreground mt-1">
                        {owner.hosts.length} host{owner.hosts.length !== 1 ? 's' : ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {owner.totalFindings}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <span className={getSeverityColor(owner.criticalCount, 'critical')}>
                          {owner.criticalCount}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className={getSeverityColor(owner.highCount, 'high')}>
                          {owner.highCount}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className={getSeverityColor(owner.mediumCount, 'medium')}>
                          {owner.mediumCount}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className={getSeverityColor(owner.lowCount, 'low')}>
                          {owner.lowCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-status-open/10 text-status-open border-status-open/20">
                        {owner.openFindings}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-status-resolved/10 text-status-resolved border-status-resolved/20">
                        {owner.fixedFindings}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-semibold">{owner.fixRate}%</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" title="Assign">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Send Report">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, ownerData.length)} of {ownerData.length} owners
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedOwner && (
        <OwnerDetailsDialog
          owner={selectedOwner}
          open={!!selectedOwner}
          onOpenChange={(open) => !open && setSelectedOwner(null)}
        />
      )}
    </>
  );
};
