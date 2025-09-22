import { Badge } from '@/components/ui/badge';
import { VulnerabilitySeverity } from '@/types/vulnerability';
import { cn } from '@/lib/utils';

interface SeverityBadgeProps {
  severity: VulnerabilitySeverity;
  className?: string;
}

const SeverityBadge = ({ severity, className }: SeverityBadgeProps) => {
  const getSeverityStyle = (severity: VulnerabilitySeverity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-severity-critical/10 text-severity-critical border-severity-critical/20';
      case 'high':
        return 'bg-severity-high/10 text-severity-high border-severity-high/20';
      case 'medium':
        return 'bg-severity-medium/10 text-severity-medium border-severity-medium/20';
      case 'low':
        return 'bg-severity-low/10 text-severity-low border-severity-low/20';
      case 'info':
        return 'bg-severity-info/10 text-severity-info border-severity-info/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        getSeverityStyle(severity),
        className
      )}
    >
      {severity}
    </Badge>
  );
};

export default SeverityBadge;