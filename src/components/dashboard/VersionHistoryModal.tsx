import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { History } from 'lucide-react';

interface Version {
  version: number;
  content: string;
  generatedAt: string;
}

interface VersionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docId: string;
  versions: Version[];
  onRestore: (docId: string, versionNum: number) => void;
}

export function VersionHistoryModal({ open, onOpenChange, docId, versions, onRestore }: VersionHistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Historique — {docId}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {versions.length > 0 ? (
            versions.map((v) => (
              <div key={v.version} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <span className="text-sm font-semibold">Version {v.version}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {new Date(v.generatedAt).toLocaleString('fr-FR')}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.content.split(/\s+/).length} mots
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRestore(docId, v.version)}
                  className="gap-1 text-xs"
                >
                  Restaurer
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune version antérieure.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
