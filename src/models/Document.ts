import { ObjectId } from 'mongodb';

export type DocumentCategory = 'Bài tập' | 'Đề giữa kỳ' | 'Đề cuối kỳ';

export interface Document {
  _id?: ObjectId;
  name: string;
  filePath: string; // Đường dẫn file PDF
  fileName: string; // Tên file gốc
  classes: ObjectId[]; // Array of class IDs that can view this document
  grade?: number; // Khối (6-12)
  note?: string; // Ghi chú
  category: DocumentCategory; // Phân loại
  uploadedBy?: ObjectId; // ID của giáo viên upload
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateDocumentData {
  name: string;
  filePath: string;
  fileName: string;
  classes: string[]; // Array of class IDs as strings
  grade?: number;
  note?: string;
  category: DocumentCategory;
}

export interface UpdateDocumentData {
  name?: string;
  classes?: string[]; // Array of class IDs as strings
  grade?: number;
  note?: string;
  category?: DocumentCategory;
  updatedAt?: Date;
}

