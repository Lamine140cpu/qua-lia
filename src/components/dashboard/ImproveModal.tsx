import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Sparkles } from 'lucide-react';

interface ImproveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  improving: boolean;
  text: string;
}

export function ImproveModal({ open, onOpenChange, targetId, improving, text }: ImproveModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Amélioration — {targetId}
          </DialogTitle>
        </DialogHeader>
        {improving ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Amélioration en cours...
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap font-mono max-h-[50vh] overflow-y-auto">
              {text || 'En attente de la réponse...'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[hsl(145,50%,36%)] font-medium">Amélioration terminée</p>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap font-mono max-h-[50vh] overflow-y-auto">
              {text}
            </div>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
