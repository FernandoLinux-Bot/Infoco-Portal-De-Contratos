// src/api.ts

import type { UploadedFile } from './types';

// --- MOCK DATABASE & VERCEL BLOB ---
// This is a mock database. In a real application, these functions would
// make network requests to your backend/database (e.g., Supabase, Vercel Postgres).

const initialFiles: UploadedFile[] = [
  { id: '1', name: 'contrato_cliente_alpha_2023.zip', size: 1258291, uploadedAt: new Date(Date.now() - 86400000), url: '/mock-download/contrato_cliente_alpha_2023.zip' },
  { id: '2', name: 'documentacao_parceria_beta_2024.zip', size: 5242880, uploadedAt: new Date(), url: '/mock-download/documentacao_parceria_beta_2024.zip' },
  { id: '3', name: 'aditivo_contratual_gama_2023.zip', size: 8388608, uploadedAt: new Date(Date.now() - 172800000), url: '/mock-download/aditivo_contratual_gama_2023.zip' },
];

let files: UploadedFile[] = [...initialFiles];

const ARTIFICIAL_DELAY = 1000; // milliseconds

/**
 * Fetches the list of files from the database.
 */
export const getFiles = async (): Promise<UploadedFile[]> => {
  console.log('API: Fetching files...');
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  console.log('API: Files fetched.', files);
  return [...files];
};

/**
 * Uploads a file to storage and saves its metadata to the database.
 * @param file The file to upload.
 */
export const uploadFile = async (file: File): Promise<UploadedFile> => {
    console.log(`API: Uploading file "${file.name}"...`);
    // In a real app:
    // 1. Upload `file` to Vercel Blob, get back a URL.
    // 2. Save metadata (name, size, url, etc.) to your database.
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY * 2));

    // Simulate potential upload failure
    if (Math.random() < 0.1) { // 10% chance to fail
        console.error('API: Simulated upload failure.');
        throw new Error('Falha simulada no upload. Tente novamente.');
    }

    const newUploadedFile: UploadedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        url: `/mock-download/${file.name}`, // This would be the real URL from Vercel Blob
    };

    files = [newUploadedFile, ...files];
    console.log('API: Upload successful.', newUploadedFile);
    return newUploadedFile;
};

/**
 * Deletes a file from storage and its metadata from the database.
 * @param fileId The ID of the file to delete.
 */
export const deleteFile = async (fileId: string): Promise<{ success: boolean }> => {
    console.log(`API: Deleting file with id "${fileId}"...`);
    // In a real app:
    // 1. Get the file metadata from your database to find its URL.
    // 2. Delete the file from Vercel Blob using the URL.
    // 3. Delete the metadata from your database.
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));

    const initialLength = files.length;
    files = files.filter(f => f.id !== fileId);

    if (files.length === initialLength) {
        console.error('API: File not found for deletion.');
        throw new Error('Arquivo não encontrado.');
    }
    
    console.log('API: Deletion successful.');
    return { success: true };
};
