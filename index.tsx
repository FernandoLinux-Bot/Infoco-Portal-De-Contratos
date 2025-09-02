import React, { useState, useCallback, FC, DragEvent, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- TYPES ---
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

// --- UTILS ---
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// --- MOCK DATA ---
const initialFiles: UploadedFile[] = [
  { id: '1', name: 'contrato_cliente_alpha_2023.zip', size: 1258291, uploadedAt: new Date(Date.now() - 86400000) },
  { id: '2', name: 'documentacao_parceria_beta_2024.zip', size: 5242880, uploadedAt: new Date() },
  { id: '3', name: 'aditivo_contratual_gama_2023.zip', size: 8388608, uploadedAt: new Date(Date.now() - 172800000) },
];

// --- COMPONENTS ---

const Header: FC = () => (
  <header className="header">
    <h1>Portal de Contratos</h1>
    <p>Envie e gerencie seus arquivos de contrato de forma segura e rápida</p>
  </header>
);

const FileUploader: FC<{ onUploadSuccess: (file: UploadedFile) => void }> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (selectedFile: File | null) => {
    setStatus('idle');
    setErrorMessage('');
    if (selectedFile) {
      if (selectedFile.type !== 'application/zip' && !selectedFile.name.endsWith('.zip')) {
        setStatus('error');
        setErrorMessage('Formato de arquivo inválido. Por favor, envie apenas arquivos .zip.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };
  
  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  }, []);
  
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     const selectedFile = e.target.files && e.target.files[0];
     handleFileChange(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    
    // --- SIMULATE UPLOAD ---
    // TODO: Substitua este bloco pela sua lógica de upload para o Vercel Blob.
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        const success = Math.random() > 0.1;
        if (!success) throw new Error('Falha simulada no upload.');
      
        const newUploadedFile: UploadedFile = {
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            uploadedAt: new Date(),
        };

        // TODO: Após o upload, salve os metadados (newUploadedFile) no Supabase.
        onUploadSuccess(newUploadedFile);
        setStatus('success');
        setFile(null);
        setTimeout(() => setStatus('idle'), 3000); // Reset status message
    } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.');
    }
  };

  return (
    <div className="card">
      <h2>Enviar Novo Contrato</h2>
      <div
        className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
        onClick={() => document.getElementById('file-input')?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="button"
        aria-label="Área para arrastar e soltar arquivos"
        tabIndex={0}
      >
        <input 
            type="file" 
            id="file-input" 
            accept=".zip,application/zip" 
            style={{ display: 'none' }}
            onChange={onFileSelect}
        />
        <p>Arraste e solte um arquivo .zip aqui ou <span>clique para selecionar</span>.</p>
      </div>

      {file && (
        <div className="file-info">
            <p><strong>Arquivo selecionado:</strong> {file.name} ({formatBytes(file.size)})</p>
        </div>
      )}

      {status === 'uploading' && <div className="spinner" style={{marginTop: '1rem'}}></div>}
      
      {status === 'success' && <div className="status-message success">Arquivo enviado com sucesso!</div>}
      {status === 'error' && <div className="status-message error">{errorMessage}</div>}
      
      <button 
        className="upload-button" 
        onClick={handleUpload} 
        disabled={!file || status === 'uploading'}
      >
        {status === 'uploading' ? 'Enviando...' : 'Enviar Arquivo'}
      </button>
    </div>
  );
};

const FileItem: FC<{ file: UploadedFile; onDelete: (file: UploadedFile) => void }> = ({ file, onDelete }) => (
    <li className="file-item">
        <div className="file-item-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="var(--accent-blue)"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        </div>
        <div className="file-item-info">
            <p className="file-name">{file.name}</p>
            <p className="file-meta">
            {formatBytes(file.size)} - {file.uploadedAt.toLocaleDateString('pt-BR')}
            </p>
        </div>
        <button className="delete-button" aria-label={`Excluir ${file.name}`} onClick={() => onDelete(file)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
    </li>
);

const FileList: FC<{
    files: UploadedFile[];
    onDelete: (file: UploadedFile) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    sortOption: string;
    onSortChange: (option: string) => void;
}> = ({ files, onDelete, searchTerm, onSearchChange, sortOption, onSortChange }) => (
  <div className="card">
    <div className="card-header">
        <h2>Contratos Enviados</h2>
        <div className="controls-container">
            <input 
                type="text"
                placeholder="Buscar por nome..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
            />
            <select className="sort-select" value={sortOption} onChange={(e) => onSortChange(e.target.value)}>
                <option value="date-desc">Mais Recentes</option>
                <option value="date-asc">Mais Antigos</option>
                <option value="name-asc">Nome (A-Z)</option>
                <option value="name-desc">Nome (Z-A)</option>
            </select>
        </div>
    </div>
    
    {files.length > 0 ? (
      <ul className="file-list">
        {files.map(file => (
          <FileItem key={file.id} file={file} onDelete={onDelete} />
        ))}
      </ul>
    ) : (
      <p className="empty-state">Nenhum contrato encontrado.</p>
    )}
  </div>
);

const ConfirmationModal: FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    fileName: string;
}> = ({ isOpen, onClose, onConfirm, fileName }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Confirmar Exclusão</h3>
                <p>Tem certeza que deseja excluir o arquivo <strong>{fileName}</strong>? Esta ação não pode ser desfeita.</p>
                <div className="modal-actions">
                    <button className="button-secondary" onClick={onClose}>Cancelar</button>
                    <button className="button-danger" onClick={onConfirm}>Excluir</button>
                </div>
            </div>
        </div>
    );
};


const Footer: FC = () => (
    <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Sua Empresa de Software. Todos os direitos reservados.</p>
    </footer>
);


const App: FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);

  const handleUploadSuccess = (newFile: UploadedFile) => {
    setUploadedFiles(prevFiles => [newFile, ...prevFiles]);
  };
  
  const handleDeleteRequest = (file: UploadedFile) => {
    setFileToDelete(file);
  };

  const handleConfirmDelete = () => {
    if (!fileToDelete) return;
    // TODO: Adicione aqui a lógica para excluir o arquivo do Vercel Blob e do Supabase.
    setUploadedFiles(prevFiles => prevFiles.filter(f => f.id !== fileToDelete.id));
    setFileToDelete(null);
  };

  const handleCloseModal = () => {
    setFileToDelete(null);
  };

  const filteredAndSortedFiles = useMemo(() => {
    return uploadedFiles
      .filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        switch (sortOption) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'date-asc':
            return a.uploadedAt.getTime() - b.uploadedAt.getTime();
          case 'date-desc':
          default:
            return b.uploadedAt.getTime() - a.uploadedAt.getTime();
        }
      });
  }, [uploadedFiles, searchTerm, sortOption]);


  return (
    <div className="app-container">
      <Header />
      <main>
        <FileUploader onUploadSuccess={handleUploadSuccess} />
        <div style={{height: '2rem'}}></div>
        <FileList 
            files={filteredAndSortedFiles} 
            onDelete={handleDeleteRequest}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortOption={sortOption}
            onSortChange={setSortOption}
        />
      </main>
      <Footer />
      <ConfirmationModal 
        isOpen={!!fileToDelete}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        fileName={fileToDelete?.name || ''}
      />
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);