import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Save, Trash2 } from 'lucide-react';
import { useLocalStorageComments } from '@/hooks/useLocalStorage';
import { Vulnerability } from '@/types/vulnerability';

interface CommentDialogProps {
  vulnerability: Vulnerability;
}

export const CommentDialog = ({ vulnerability }: CommentDialogProps) => {
  const { addComment, getComment, removeComment } = useLocalStorageComments();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  
  // Create a unique key for the vulnerability
  const vulnKey = `${vulnerability.host}-${vulnerability.name}-${vulnerability.port}`;
  const existingComment = getComment(vulnKey);

  const handleOpen = () => {
    setComment(existingComment);
    setOpen(true);
  };

  const handleSave = () => {
    if (comment.trim()) {
      addComment(vulnKey, comment.trim());
    } else {
      removeComment(vulnKey);
    }
    setOpen(false);
  };

  const handleDelete = () => {
    removeComment(vulnKey);
    setComment('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpen}
          className="h-8 w-8 p-0"
        >
          <MessageSquare className={`h-4 w-4 ${existingComment ? 'text-primary' : 'text-muted-foreground'}`} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Comment</DialogTitle>
          <DialogDescription>
            Add notes or comments for this vulnerability finding.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">{vulnerability.name}</p>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">{vulnerability.host}:{vulnerability.port}</Badge>
              <Badge 
                className={`text-xs ${
                  vulnerability.severity === 'Critical' ? 'bg-severity-critical' :
                  vulnerability.severity === 'High' ? 'bg-severity-high' :
                  vulnerability.severity === 'Medium' ? 'bg-severity-medium' :
                  vulnerability.severity === 'Low' ? 'bg-severity-low' : 'bg-severity-info'
                } text-white`}
              >
                {vulnerability.severity}
              </Badge>
            </div>
          </div>
          
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter your comments or notes about this vulnerability..."
            className="min-h-[100px]"
          />
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {existingComment && (
              <Button variant="outline" onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};