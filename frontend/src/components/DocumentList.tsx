'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Eye, AlertCircle, Loader2, Clock, CheckCircle, XCircle, FileSignature } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { documentsApi, Document } from '@/lib/api/documents';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DocumentListProps {
  tenantId: string;
  documentType?: Document['documentType'];
  onDocumentDeleted?: () => void;
  showUploadButton?: boolean;
  onUploadClick?: () => void;
}

export default function DocumentList({
  tenantId,
  documentType,
  onDocumentDeleted,
  showUploadButton = false,
  onUploadClick
}: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [requestingSignature, setRequestingSignature] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [tenantId, documentType]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');

    try {
      let docs: Document[];
      if (documentType) {
        docs = await documentsApi.getDocumentsByType('tenant', tenantId, documentType);
      } else {
        const response = await documentsApi.getTenantDocuments(tenantId);
        docs = response.data.documents; // Access the documents array from the nested structure
      }
      // Ensure docs is always an array
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError(err.message || 'Failed to load documents');
      setDocuments([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (document: Document) => {
    setDeletingId(document.id);
    try {
      await documentsApi.deleteDocument(document.id);
      setDocuments(documents.filter(doc => doc.id !== document.id));
      if (onDocumentDeleted) {
        onDocumentDeleted();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    } finally {
      setDeletingId(null);
      setDocumentToDelete(null);
    }
  };

  const handleView = (document: Document) => {
    // Construct full URL - check if it's already a full URL (Cloudinary) or relative path (local)
    const fullUrl = document.url.startsWith('http')
      ? document.url
      : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '')}${document.url}`;
    window.open(fullUrl, '_blank');
  };

  const handleDownload = (document: Document) => {
    // Construct full URL - check if it's already a full URL (Cloudinary) or relative path (local)
    const fullUrl = document.url.startsWith('http')
      ? document.url
      : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '')}${document.url}`;
    const link = window.document.createElement('a');
    link.href = fullUrl;
    link.download = document.name;
    link.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDocumentTypeLabel = (type: Document['documentType']): string => {
    const labels: Record<Document['documentType'], string> = {
      lease_agreement: 'Lease Agreement',
      id_document: 'ID Document',
      payment_proof: 'Payment Proof',
      inspection_report: 'Inspection Report',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3 w-3" />
            Draft
          </Badge>
        );
      case 'pending_signature':
        return (
          <Badge variant="default" className="gap-1 bg-amber-500 hover:bg-amber-600">
            <Clock className="h-3 w-3" />
            Pending Signature
          </Badge>
        );
      case 'signed':
        return (
          <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-3 w-3" />
            Signed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleRequestSignature = async (document: Document) => {
    setRequestingSignature(document.id);
    try {
      const response = await documentsApi.requestSignature(document.id);
      if (response.success) {
        // Update the document in the list
        setDocuments(documents.map(doc =>
          doc.id === document.id ? response.data : doc
        ));
        toast.success('Signature requested - tenant will be notified to sign this document');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to request signature');
    } finally {
      setRequestingSignature(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">
          {documentType
            ? `No ${getDocumentTypeLabel(documentType).toLowerCase()} uploaded yet`
            : 'No documents uploaded yet'}
        </p>
        {showUploadButton && onUploadClick && (
          <Button onClick={onUploadClick} className="mt-4" variant="outline">
            Upload Document
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {documents.map((document) => (
          <div
            key={document.id}
            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{document.name}</p>
                {getStatusBadge(document.status)}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>{formatFileSize(document.size)}</span>
                <span>•</span>
                <span>{formatDate(document.createdAt)}</span>
                {!documentType && (
                  <>
                    <span>•</span>
                    <span>{getDocumentTypeLabel(document.documentType)}</span>
                  </>
                )}
              </div>
              {document.description && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {document.description}
                </p>
              )}
              {document.status === 'signed' && document.signedAt && (
                <p className="text-xs text-green-600 mt-1">
                  Signed on {formatDate(document.signedAt)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {document.documentType === 'lease_agreement' && document.status === 'draft' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleRequestSignature(document)}
                  disabled={requestingSignature === document.id}
                  title="Request Signature"
                >
                  {requestingSignature === document.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <FileSignature className="h-4 w-4 mr-1" />
                      Request Signature
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(document)}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(document)}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDocumentToDelete(document)}
                disabled={deletingId === document.id}
                title="Delete"
              >
                {deletingId === document.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-red-600" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => documentToDelete && handleDelete(documentToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
