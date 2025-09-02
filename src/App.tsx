import React, { useState, useCallback, FC, DragEvent, useMemo, useEffect } from 'react';
import * as api from './api';
import type { UploadedFile, Notification as NotificationType } from './types';


// --- UTILS ---
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// --- COMPONENTS ---

const Header: FC = () => (
  <header className="header">
    <h1>Portal de Contratos</h1>
    <p>Envie e gerencie seus arquivos de contrato de forma segura e rápida</p>
  </header>
);

const FileUploader: FC<{ 
    onUploadSuccess: (file: UploadedFile) => void;
    addNotification: (message: string, type: 'success' | 'error') => void;
}> = ({ onUploadSuccess, addNotification }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      if (selectedFile.type !== 'application/zip' && !selectedFile.name.endsWith('.zip')) {
        addNotification('Formato de arquivo inválido. Por favor, envie apenas arquivos .zip.', 'error');
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
  }, [addNotification]);
  
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     const selectedFile = e.target.files && e.target.files[0];
     handleFileChange(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    
    try {
        const newUploadedFile = await api.uploadFile(file);
        onUploadSuccess(newUploadedFile);
        addNotification('Arquivo enviado com sucesso!', 'success');
        setFile(null);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
        addNotification(message, 'error');
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="card">
      <h2>Enviar Novo Contrato</h2>
      <div
        className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
        onClick={() => !isUploading && document.getElementById('file-input')?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="button"
        aria-label="Área para arrastar e soltar arquivos"
        tabIndex={0}
        style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
      >
        <input 
            type="file" 
            id="file-input" 
            accept=".zip,application/zip" 
            style={{ display: 'none' }}
            onChange={onFileSelect}
            disabled={isUploading}
        />
        <p>Arraste e solte um arquivo .zip aqui ou <span>clique para selecionar</span>.</p>
      </div>

      {file && (
        <div className="file-info">
            <p><strong>Arquivo selecionado:</strong> {file.name} ({formatBytes(file.size)})</p>
        </div>
      )}
      
      <button 
        className="upload-button" 
        onClick={handleUpload} 
        disabled={!file || isUploading}
      >
        {isUploading ? (
          <>
            <div className="spinner-inline"></div>
            <span>Enviando...</span>
          </>
        ) : 'Enviar Arquivo'}
      </button>
    </div>
  );
};

const FileItem: FC<{ 
    file: UploadedFile; 
    onDelete: (file: UploadedFile) => void;
    onDownload: (file: UploadedFile) => void;
}> = ({ file, onDelete, onDownload }) => (
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
        <div className="file-item-actions">
            <button className="download-button" aria-label={`Download ${file.name}`} onClick={() => onDownload(file)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
            <button className="delete-button" aria-label={`Excluir ${file.name}`} onClick={() => onDelete(file)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        </div>
    </li>
);

const FileList: FC<{
    files: UploadedFile[];
    isLoading: boolean;
    onDelete: (file: UploadedFile) => void;
    onDownload: (file: UploadedFile) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    sortOption: string;
    onSortChange: (option: string) => void;
}> = ({ files, isLoading, onDelete, onDownload, searchTerm, onSearchChange, sortOption, onSortChange }) => (
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
    
    {isLoading ? (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando contratos...</p>
        </div>
    ) : files.length > 0 ? (
      <ul className="file-list">
        {files.map(file => (
          <FileItem key={file.id} file={file} onDelete={onDelete} onDownload={onDownload} />
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

const Notification: FC<{ notification: NotificationType, onClose: (id: number) => void }> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`notification ${notification.type}`}>
      <p>{notification.message}</p>
      <button className="notification-close-button" onClick={() => onClose(notification.id)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  );
};

const NotificationsContainer: FC<{ notifications: NotificationType[], onClose: (id: number) => void }> = ({ notifications, onClose }) => {
  return (
    <div className="notifications-container">
      {notifications.map(n => (
        <Notification key={n.id} notification={n} onClose={onClose} />
      ))}
    </div>
  );
};

const Footer: FC = () => (
    <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Sua Empresa de Software. Todos os direitos reservados.</p>
    </footer>
);


const App: FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  useEffect(() => {
    const fetchFiles = async () => {
        try {
            const files = await api.getFiles();
            setUploadedFiles(files);
        } catch (error) {
            addNotification('Falha ao carregar os contratos.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    fetchFiles();
  }, []);

  const addNotification = useCallback((message: string, type: 'success' | 'error') => {
    const newNotification = { id: Date.now(), message, type };
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  const handleUploadSuccess = (newFile: UploadedFile) => {
    setUploadedFiles(prevFiles => [newFile, ...prevFiles]);
  };
  
  const handleDeleteRequest = (file: UploadedFile) => {
    setFileToDelete(file);
  };
  
  const handleDownload = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification(`Download de "${file.name}" iniciado.`, 'success');
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    try {
        await api.deleteFile(fileToDelete.id);
        setUploadedFiles(prevFiles => prevFiles.filter(f => f.id !== fileToDelete.id));
        addNotification('Arquivo excluído com sucesso.', 'success');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível excluir o arquivo.';
        addNotification(message, 'error');
    } finally {
        setFileToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setFileToDelete(null);
  };

  const filteredAndSortedFiles = useMemo(() => {
    return [...uploadedFiles] // Create a shallow copy before sorting
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
      <NotificationsContainer notifications={notifications} onClose={removeNotification} />
      <Header />
      <main>
        <FileUploader onUploadSuccess={handleUploadSuccess} addNotification={addNotification} />
        <div style={{height: '2rem'}}></div>
        <FileList 
            files={filteredAndSortedFiles} 
            isLoading={isLoading}
            onDelete={handleDeleteRequest}
            onDownload={handleDownload}
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

export default App;
