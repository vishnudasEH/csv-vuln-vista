import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Check, User, RefreshCw } from 'lucide-react';
import { Vulnerability, VulnerabilityStatus } from '@/types/vulnerability';

interface BulkActionsProps {
  selectedCount: number;
  selectedVulnerabilities: Vulnerability[];
  onClearSelection: () => void;
  onBulkUpdate: (updates: Array<{name: string, host: string} & Partial<Vulnerability>>) => Promise<void>;
  onBulkRetest?: () => void;
  availableAssignees: string[];
}

export const BulkActions = ({
  selectedCount,
  selectedVulnerabilities,
  onClearSelection,
  onBulkUpdate,
  onBulkRetest,
  availableAssignees,
}: BulkActionsProps) => {
  const handleStatusChange = async (status: VulnerabilityStatus) => {
    const updates = selectedVulnerabilities.map(vuln => ({
      name: vuln.name,
      host: vuln.host,
      status
    }));
    await onBulkUpdate(updates);
    onClearSelection();
  };

  const handleAssigneeChange = async (assignee: string) => {
    const updates = selectedVulnerabilities.map(vuln => ({
      name: vuln.name,
      host: vuln.host,
      assigned_to: assignee === 'unassigned' ? '' : assignee
    }));
    await onBulkUpdate(updates);
    onClearSelection();
  };

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-4 p-4 bg-primary/5 border rounded-lg mb-4">
      <Badge variant="secondary" className="flex items-center gap-1">
        <Check className="h-3 w-3" />
        {selectedCount} selected
      </Badge>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Change Status:</span>
        <Select onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Fixed">Fixed</SelectItem>
            <SelectItem value="Triaged">Triaged</SelectItem>
            <SelectItem value="False Positive">False Positive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <User className="h-4 w-4" />
        <span className="text-sm font-medium">Assign to:</span>
        <Select onValueChange={handleAssigneeChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {availableAssignees.map((assignee) => (
              <SelectItem key={assignee} value={assignee}>
                {assignee}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {onBulkRetest && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onBulkRetest}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Retest Selected
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onClearSelection}
        className="ml-auto"
      >
        <X className="h-4 w-4 mr-1" />
        Clear Selection
      </Button>
    </div>
  );
};

export default BulkActions;