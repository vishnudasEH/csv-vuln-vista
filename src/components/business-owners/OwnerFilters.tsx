import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OwnerFiltersState } from '@/pages/BusinessOwnersDashboard';
import { Badge } from '@/components/ui/badge';

interface OwnerFiltersProps {
  filters: OwnerFiltersState;
  setFilters: (filters: OwnerFiltersState) => void;
}

export const OwnerFilters = ({ filters, setFilters }: OwnerFiltersProps) => {
  const severityOptions = ['Critical', 'High', 'Medium', 'Low'];
  const statusOptions = ['Open', 'Fixed', 'Triaged', 'False Positive'];

  const toggleSeverity = (severity: string) => {
    const current = filters.severity;
    const updated = current.includes(severity)
      ? current.filter(s => s !== severity)
      : [...current, severity];
    setFilters({ ...filters, severity: updated });
  };

  const toggleStatus = (status: string) => {
    const current = filters.status;
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    setFilters({ ...filters, status: updated });
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      severity: [],
      status: [],
      dateRange: {},
    });
  };

  const hasActiveFilters = filters.searchTerm || filters.severity.length > 0 || filters.status.length > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by owner name, IP, or domain..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={resetFilters}
                className="mt-6"
              >
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Severity</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {severityOptions.map(severity => (
                  <Badge
                    key={severity}
                    variant={filters.severity.includes(severity) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSeverity(severity)}
                  >
                    {severity}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {statusOptions.map(status => (
                  <Badge
                    key={status}
                    variant={filters.status.includes(status) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleStatus(status)}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
