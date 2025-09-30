import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export interface RetestResult {
  name: string;
  host: string;
  success: boolean;
  status?: string;
  findingsCount?: number;
  error?: string;
}

interface RetestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: RetestResult[];
  isRunning: boolean;
  total: number;
  completed: number;
}

export const RetestDialog = ({
  open,
  onOpenChange,
  results,
  isRunning,
  total,
  completed,
}: RetestDialogProps) => {
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const successCount = results.filter(r => r.success && r.status === 'fixed').length;
  const openCount = results.filter(r => r.success && r.status === 'open').length;
  const failedCount = results.filter(r => !r.success).length;

  const getStatusIcon = (result: RetestResult) => {
    if (!result.success) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    if (result.status === 'fixed') {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (result: RetestResult) => {
    if (!result.success) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (result.status === 'fixed') {
      return <Badge className="bg-green-500 hover:bg-green-600">Fixed</Badge>;
    }
    return <Badge variant="destructive">Still Open</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Retest Results</DialogTitle>
          <DialogDescription>
            {isRunning ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Retesting vulnerabilities... {completed} of {total}
              </span>
            ) : (
              `Completed ${total} retest${total !== 1 ? 's' : ''}`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          {isRunning && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                {completed} / {total} completed
              </p>
            </div>
          )}

          {/* Summary Stats */}
          {!isRunning && results.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Fixed</p>
                  <p className="text-2xl font-bold">{successCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Still Open</p>
                  <p className="text-2xl font-bold">{openCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-red-50 dark:bg-red-950/20">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium">Failed</p>
                  <p className="text-2xl font-bold">{failedCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results List */}
          <ScrollArea className="h-[300px] border rounded-lg p-4">
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={`${result.name}-${result.host}-${index}`}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-card"
                >
                  {getStatusIcon(result)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.name}</p>
                    <p className="text-sm text-muted-foreground">{result.host}</p>
                    {result.error && (
                      <p className="text-xs text-destructive mt-1">{result.error}</p>
                    )}
                    {result.success && result.findingsCount !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.findingsCount} finding{result.findingsCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(result)}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)} disabled={isRunning}>
              {isRunning ? 'Please wait...' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
