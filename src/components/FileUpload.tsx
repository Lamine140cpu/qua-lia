import { useCallback, useRef } from 'react';
import { useWizardStore, type UploadedFile } from '@/stores/wizard-store';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = [
  'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml',
  'text/plain', 'text/markdown', 'text/csv',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

interface FileUploadProps {
  /** Filter to show only files for this indicateur */
  indicateurId?: string;
  /** Label shown above the dropzone */
  label?: string;
}

export function FileUpload({ indicateurId, label }: FileUploadProps) {
  const { uploadedFiles, addUploadedFile, removeUploadedFile } = useWizardStore();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const files = indicateurId
    ? uploadedFiles.filter(f => f.indicateurId === indicateurId)
    : uploadedFiles;

  const handleFiles = useCallback(async (fileList: FileList) => {
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'Fichier trop volumineux', description: `${file.name} dépasse 5 Mo`, variant: 'destructive' });
        continue;
      }

      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
        toast({ title: 'Type non supporté', description: `${file.name} — formats acceptés : images, PDF, DOCX, XLSX, TXT, MD`, variant: 'destructive' });
        continue;
      }

      const isImage = file.type.startsWith('image/');
      const isText = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt');

      let dataUri: string | undefined;
      let textContent: string | undefined;

      if (isImage) {
        dataUri = await readAsDataUri(file);
      } else if (isText) {
        textContent = await readAsText(file);
      } else {
        // For PDF/DOCX/XLSX, store the name as reference (content extraction would require server-side)
        textContent = `[Fichier uploadé : ${file.name} (${(file.size / 1024).toFixed(0)} Ko)]`;
      }

      const uploaded: UploadedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        textContent,
        dataUri,
        indicateurId,
        uploadedAt: new Date().toISOString(),
      };

      addUploadedFile(uploaded);
    }
  }, [addUploadedFile, indicateurId, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors"
      >
        <Upload className="w-6 h-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Glissez vos fichiers ici ou <span className="text-primary font-medium">cliquez pour parcourir</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Images, PDF, DOCX, XLSX, TXT — max 5 Mo
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.docx,.xlsx,.txt,.md,.csv"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-2 rounded-md border bg-card px-3 py-2">
              {f.type.startsWith('image/') ? (
                <Image className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm text-foreground truncate flex-1">{f.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(f.uploadedAt).toLocaleDateString('fr-FR')}
              </span>
              <button onClick={(e) => { e.stopPropagation(); removeUploadedFile(f.id); }} className="p-1 hover:bg-muted rounded">
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
