import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './button';
import { Card } from './card';
import { CloudUpload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile?: File;
  accept?: string[];
  maxSize?: number;
  className?: string;
}

export function FileUpload({ 
  onFileSelect, 
  onFileRemove, 
  selectedFile, 
  accept = ['.pdf', '.doc', '.docx', '.txt'],
  maxSize = 10 * 1024 * 1024, // 10MB
  className 
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('Arquivo muito grande. Tamanho máximo: 10MB');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Tipo de arquivo não suportado. Use apenas PDF, DOC, DOCX ou TXT');
      } else {
        setError('Erro no upload do arquivo');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Additional validation for dangerous file types
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (dangerousExtensions.includes(fileExtension)) {
        setError('Tipo de arquivo não permitido por segurança. Use apenas documentos (PDF, DOC, DOCX, TXT)');
        return;
      }
      
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize,
    multiple: false
  });

  if (selectedFile) {
    return (
      <Card className={cn("p-6", className)} data-testid="card-selected-file">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <File className="text-primary" size={20} />
            </div>
            <div>
              <div className="font-medium" data-testid="text-file-name">{selectedFile.name}</div>
              <div className="text-sm text-muted-foreground" data-testid="text-file-size">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFileRemove}
            data-testid="button-remove-file"
          >
            <X size={16} />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed p-12 text-center cursor-pointer transition-colors",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary hover:bg-accent/5",
          error && "border-destructive"
        )}
        data-testid="card-file-upload"
      >
        <input {...getInputProps()} data-testid="input-file" />
        
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CloudUpload className="text-primary" size={32} />
        </div>
        
        {isDragActive ? (
          <div>
            <h3 className="text-lg font-semibold mb-2" data-testid="text-drop-here">
              Solte o arquivo aqui
            </h3>
            <p className="text-muted-foreground">O arquivo será carregado automaticamente</p>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold mb-2" data-testid="text-upload-title">
              Arraste seu arquivo aqui
            </h3>
            <p className="text-muted-foreground mb-4" data-testid="text-upload-description">
              ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-file-requirements">
              {accept.join(', ')} até {maxSize / 1024 / 1024}MB
            </p>
          </div>
        )}
      </Card>
      
      {error && (
        <p className="text-sm text-destructive mt-2" data-testid="text-upload-error">
          {error}
        </p>
      )}
    </div>
  );
}
