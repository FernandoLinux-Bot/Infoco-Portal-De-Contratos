// src/api.ts

import type { UploadedFile } from './types';

const API_BASE_URL = '/api/contracts';

// Interface para o objeto de arquivo bruto retornado pelo Supabase
interface SupabaseFile {
  id: string;
  name: string;
  size: number;
  url: string;
  uploaded_at: string; // Supabase retorna datas como strings ISO
}


/**
 * Busca a lista de arquivos da nossa API de backend.
 */
export const getFiles = async (): Promise<UploadedFile[]> => {
  const response = await fetch(API_BASE_URL);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || 'Falha ao carregar os contratos do servidor.');
  }

  const data: SupabaseFile[] = await response.json();
  
  // O Supabase retorna datas como strings ISO. Nós as convertemos para objetos Date
  // para que o resto da aplicação continue funcionando como esperado.
  return data.map((file) => ({
    id: file.id,
    name: file.name,
    size: file.size,
    url: file.url,
    uploadedAt: new Date(file.uploaded_at), // Converte a string de data
  }));
};

/**
 * Envia um arquivo para nossa API de backend.
 * @param file O arquivo para enviar.
 */
export const uploadFile = async (file: File): Promise<UploadedFile> => {
    // A API espera o nome do arquivo como um parâmetro de busca na URL
    const response = await fetch(`${API_BASE_URL}?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': file.type,
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Falha no upload do arquivo.');
    }

    const newFileData: SupabaseFile = await response.json();
    
    // Converte a data retornada para um objeto Date
    return {
      id: newFileData.id,
      name: newFileData.name,
      size: newFileData.size,
      url: newFileData.url,
      uploadedAt: new Date(newFileData.uploaded_at),
    };
};

/**
 * Deleta um arquivo através da nossa API de backend.
 * @param fileId O ID do arquivo a ser deletado.
 * @param fileUrl A URL do arquivo no Vercel Blob.
 */
export const deleteFile = async (fileId: string, fileUrl: string): Promise<{ success: boolean }> => {
    const response = await fetch(API_BASE_URL, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: fileId, url: fileUrl }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Não foi possível excluir o arquivo.');
    }
    
    return await response.json();
};
