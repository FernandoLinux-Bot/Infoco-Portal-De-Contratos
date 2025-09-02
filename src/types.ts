// src/types.ts

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  url: string; // URL for downloading from Vercel Blob
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error';
}
