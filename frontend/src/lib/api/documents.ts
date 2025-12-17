import { apiClient } from '../api-client';

export interface Document {
  id: string;
  entityType: 'tenant' | 'property' | 'unit' | 'payment';
  entityId: string;
  documentType: 'lease_agreement' | 'id_document' | 'payment_proof' | 'inspection_report' | 'other';
  name: string;
  mimeType: string;
  size: number;
  url: string;
  publicId?: string;
  description?: string;
  uploadedBy: string;
  status: 'draft' | 'pending_signature' | 'signed' | 'rejected';
  signedBy?: string;
  signedAt?: string;
  requestedSignatureAt?: string;
  signatureMethod?: 'uploaded' | 'physical' | 'typed' | 'none';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentResponse {
  success: boolean;
  message: string;
  data: Document;
}

export interface GetDocumentsResponse {
  success: boolean;
  data: {
    documents: Document[];
    total: number;
  };
}

export interface DeleteDocumentResponse {
  success: boolean;
  message: string;
}

export const documentsApi = {
  // Upload document for a tenant
  uploadTenantDocument: async (
    tenantId: string,
    file: File,
    documentType: Document['documentType'],
    description?: string
  ): Promise<UploadDocumentResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (description) {
      formData.append('description', description);
    }

    const response = await apiClient.postFormData<UploadDocumentResponse>(
      `/documents/tenant/${tenantId}`,
      formData
    );
    return response.data!;
  },

  // Get all documents for an entity
  getDocumentsByEntity: async (
    entityType: Document['entityType'],
    entityId: string
  ): Promise<GetDocumentsResponse> => {
    const response = await apiClient.get<GetDocumentsResponse>(
      `/documents/entity/${entityType}/${entityId}`
    );
    return response.data!;
  },

  // Get all documents for a tenant
  getTenantDocuments: async (tenantId: string): Promise<GetDocumentsResponse> => {
    return documentsApi.getDocumentsByEntity('tenant', tenantId);
  },

  // Delete a document
  deleteDocument: async (documentId: string): Promise<DeleteDocumentResponse> => {
    const response = await apiClient.delete<DeleteDocumentResponse>(
      `/documents/${documentId}`
    );
    return response.data!;
  },

  // Get documents by type
  getDocumentsByType: async (
    entityType: Document['entityType'],
    entityId: string,
    documentType: Document['documentType']
  ): Promise<Document[]> => {
    const response = await documentsApi.getDocumentsByEntity(entityType, entityId);
    return response.data.documents.filter((doc: Document) => doc.documentType === documentType);
  },

  // Get lease agreements for a tenant
  getTenantLeaseAgreements: async (tenantId: string): Promise<Document[]> => {
    return documentsApi.getDocumentsByType('tenant', tenantId, 'lease_agreement');
  },

  // Update document status
  updateDocumentStatus: async (
    documentId: string,
    status: Document['status'],
    notes?: string
  ): Promise<{ success: boolean; data: Document }> => {
    const response = await apiClient.patch<{ success: boolean; data: Document }>(
      `/documents/${documentId}/status`,
      { status, notes }
    );
    return response.data!;
  },

  // Request signature from tenant
  requestSignature: async (documentId: string): Promise<{ success: boolean; data: Document }> => {
    const response = await apiClient.post<{ success: boolean; data: Document }>(
      `/documents/${documentId}/request-signature`
    );
    return response.data!;
  },

  // Sign document (tenant action)
  signDocument: async (
    documentId: string,
    signatureMethod: 'uploaded' | 'physical' | 'typed'
  ): Promise<{ success: boolean; data: Document }> => {
    const response = await apiClient.post<{ success: boolean; data: Document }>(
      `/documents/${documentId}/sign`,
      { signatureMethod }
    );
    return response.data!;
  }
};
