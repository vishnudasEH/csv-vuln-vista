import { Badge } from '@/components/ui/badge';
import { VulnerabilityStatus } from '@/types/vulnerability';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: VulnerabilityStatus;
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getStatusStyle = (status: VulnerabilityStatus) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-status-open/10 text-status-open border-status-open/20';
      case 'in progress':
        return 'bg-status-progress/10 text-status-progress border-status-progress/20';
      case 'resolved':
        return 'bg-status-resolved/10 text-status-resolved border-status-resolved/20';
      case 'closed':
        return 'bg-status-closed/10 text-status-closed border-status-closed/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        getStatusStyle(status),
        className
      )}
    >
      {status}
    </Badge>
  );
};

export default StatusBadge;