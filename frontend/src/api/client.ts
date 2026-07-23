import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

export interface QueryRequest {
  question: string;
  chunk_size?: number;
  similarity_threshold?: number;
}

export interface SourceItem {
  content: string;
  source: string;
  page: number;
  score: number;
}

export interface QueryResponse {
  answer: string;
  sources: SourceItem[];
}

export interface UploadResponse {
  filename: string;
  chunks: number;
  message: string;
}

export interface DocumentItem {
  filename: string;
  chunks: number;
  uploaded_at: string;
}

export interface ConfigResponse {
  chunk_size_min: number;
  chunk_size_max: number;
  chunk_size_default: number;
  threshold_min: number;
  threshold_max: number;
  threshold_default: number;
  ollama_status: string;
  document_count: number;
}

export async function query(data: QueryRequest): Promise<QueryResponse> {
  const res = await api.post('/query', data);
  return res.data;
}

export async function upload(
  file: File,
  chunkSize: number,
): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('chunk_size', String(chunkSize));
  const res = await api.post('/upload', form);
  return res.data;
}

export async function listDocuments(): Promise<{ documents: DocumentItem[] }> {
  const res = await api.get('/documents');
  return res.data;
}

export async function getConfig(): Promise<ConfigResponse> {
  const res = await api.get('/config');
  return res.data;
}

export default api;
