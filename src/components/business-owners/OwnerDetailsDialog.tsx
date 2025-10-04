import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Building2, RefreshCw, ExternalLink } from 'lucide-react';
import SeverityBadge from '@/components/ui/severity-badge';
import StatusBadge from '@/components/ui/status-badge';
import { useState } from 'react';
import { CSVService } from '@/services/csvService';
import { toast } from 'sonner';

interface OwnerDetailsDialogProps {
  owner: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OwnerDetailsDialog = ({ owner, open, onOpenChange }: OwnerDetailsDialogProps) => {
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [retesting, setRetesting] = useState<Set<string>>(new Set());

  const handleRetest = async (vuln: any) => {
    const key = `${vuln.name}-${vuln.host}`;
    setRetesting(prev => new Set(prev).add(key));
    
    try {
      const result = await CSVService.retestVulnerability(vuln.name, vuln.host);
      if (result.success) {
        toast.success(`Retest completed: ${result.status}`);
      } else {
        toast.error('Retest failed');
      }
    } catch (error) {
      toast.error('Failed to initiate retest');
    } finally {
      setRetesting(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const hostVulnerabilities = selectedHost
    ? owner.vulnerabilities.filter((v: any) => v.host.split(':')[0] === selectedHost)
    : owner.vulnerabilities;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {owner.owner}
          </DialogTitle>
          <DialogDescription>
            Business owner details and vulnerability information
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="findings">Findings</TabsTrigger>
            <TabsTrigger value="hosts">Hosts & IPs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{owner.totalFindings}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Open Findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-status-open">{owner.openFindings}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Fixed Findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-status-resolved">{owner.fixedFindings}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Fix Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{owner.fixRate}%</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Critical</span>
                    <Badge variant="outline" className="bg-severity-critical/10 text-severity-critical border-severity-critical/20">
                      {owner.criticalCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">High</span>
                    <Badge variant="outline" className="bg-severity-high/10 text-severity-high border-severity-high/20">
                      {owner.highCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Medium</span>
                    <Badge variant="outline" className="bg-severity-medium/10 text-severity-medium border-severity-medium/20">
                      {owner.mediumCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Low</span>
                    <Badge variant="outline" className="bg-severity-low/10 text-severity-low border-severity-low/20">
                      {owner.lowCount}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{owner.owner}</span>
                </div>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="findings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Vulnerabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vulnerability</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hostVulnerabilities.map((vuln: any) => {
                        const retestKey = `${vuln.name}-${vuln.host}`;
                        const isRetesting = retesting.has(retestKey);
                        return (
                          <TableRow key={vuln.id}>
                            <TableCell className="font-medium max-w-xs truncate">
                              {vuln.name}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{vuln.host}</TableCell>
                            <TableCell>
                              <SeverityBadge severity={vuln.severity} />
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={vuln.status} />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRetest(vuln)}
                                disabled={isRetesting}
                              >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRetesting ? 'animate-spin' : ''}`} />
                                Retest
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hosts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Managed Hosts ({owner.hosts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {owner.hosts.map((host: string) => {
                    const hostVulnCount = owner.vulnerabilities.filter(
                      (v: any) => v.host.split(':')[0] === host
                    ).length;
                    return (
                      <Card
                        key={host}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => setSelectedHost(selectedHost === host ? null : host)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="font-mono text-sm font-medium">{host}</div>
                              <div className="text-xs text-muted-foreground">
                                {hostVulnCount} finding{hostVulnCount !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHost(host);
                            }}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {selectedHost && (
              <Card>
                <CardHeader>
                  <CardTitle>Vulnerabilities for {selectedHost}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vulnerability</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {owner.vulnerabilities
                          .filter((v: any) => v.host.split(':')[0] === selectedHost)
                          .map((vuln: any) => {
                            const retestKey = `${vuln.name}-${vuln.host}`;
                            const isRetesting = retesting.has(retestKey);
                            return (
                              <TableRow key={vuln.id}>
                                <TableCell className="font-medium">{vuln.name}</TableCell>
                                <TableCell>
                                  <SeverityBadge severity={vuln.severity} />
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={vuln.status} />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRetest(vuln)}
                                    disabled={isRetesting}
                                  >
                                    <RefreshCw className={`h-4 w-4 ${isRetesting ? 'animate-spin' : ''}`} />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
