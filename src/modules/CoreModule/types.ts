export type RecordData = Record<string, any>;
export interface Envelope<T = any> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string>;
  meta?: { total: number; page: number; limit: number; totalPages: number };
}
export interface Field extends RecordData {
  name: string;
  type?: string;
  label?: string;
}
export interface FormConfig extends RecordData {
  fields: Field[];
}
export interface Session {
  token: string;
  user: RecordData;
}
