'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Eye, Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

export default function TenantDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signingDocument, setSigningDocument] = useState<Document | null>(null);
  const [uploadingSignedDoc, setUploadingSignedDoc] = useState(false);
  const [signedFile, setSignedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');

    try {
      // Get all documents for the current tenant
      // The backend will filter by the logged-in user's tenant
      const response = await documentsApi.getDocumentsByEntity('tenant', 'current');
      setDocuments(response.data.documents);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError(err.message || 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (document: Document) => {
    const fullUrl = document.url.startsWith('http')
      ? document.url
      : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '')}${document.url}`;
    window.open(fullUrl, '_blank');
  };

  const handleDownload = (document: Document) => {
    const fullUrl = document.url.startsWith('http')
      ? document.url
      : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '')}${document.url}`;
    const link = window.document.createElement('a');
    link.href = fullUrl;
    link.download = document.name;
    link.click();
  };

  const handleSignDocument = async () => {
    if (!signingDocument || !signedFile) return;

    setUploadingSignedDoc(true);
    try {
      // Sign the document
      await documentsApi.signDocument(signingDocument.id, 'uploaded');

      // Refresh documents list
      await fetchDocuments();

      toast.success('Document signed successfully');
      setSigningDocument(null);
      setSignedFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign document');
    } finally {
      setUploadingSignedDoc(false);
    }
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
            <AlertCircle className="h-3 w-3" />
            Action Required
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
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const pendingDocuments = documents.filter(doc => doc.status === 'pending_signature');
  const signedDocuments = documents.filter(doc => doc.status === 'signed');
  const otherDocuments = documents.filter(doc => doc.status !== 'pending_signature' && doc.status !== 'signed');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          View and sign your lease agreements and other documents
        </p>
      </div>

      {/* Pending Signatures Section */}
      {pendingDocuments.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5" />
              Documents Requiring Your Signature
            </CardTitle>
            <CardDescription className="text-amber-700">
              Please review and sign the following documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingDocuments.map((document) => (
              <div
                key={document.id}
                className="flex items-center gap-4 p-4 border border-amber-200 bg-white rounded-lg"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-amber-600" />
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
                    <span>Requested on {formatDate(document.requestedSignatureAt!)}</span>
                  </div>
                  {document.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {document.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(document)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(document)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSigningDocument(document)}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Sign Document
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Signed Documents Section */}
      {signedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Signed Documents
            </CardTitle>
            <CardDescription>
              Documents you have signed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {signedDocuments.map((document) => (
              <div
                key={document.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-600" />
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
                    <span>Signed on {formatDate(document.signedAt!)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(document)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(document)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Other Documents Section */}
      {otherDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Other Documents</CardTitle>
            <CardDescription>
              Additional documents related to your tenancy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {otherDocuments.map((document) => (
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
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(document)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(document)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {documents.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No documents available</p>
          </CardContent>
        </Card>
      )}

      {/* Sign Document Dialog */}
      <AlertDialog open={!!signingDocument} onOpenChange={() => setSigningDocument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Document</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                To sign <strong>{signingDocument?.name}</strong>, please follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Download the document using the button above</li>
                <li>Print and sign the document physically</li>
                <li>Scan or take a clear photo of the signed document</li>
                <li>Upload the signed document below</li>
              </ol>
              <div className="space-y-2">
                <label htmlFor="signed-file" className="text-sm font-medium">
                  Upload Signed Document
                </label>
                <input
                  id="signed-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSignedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, JPEG, PNG (max 10MB)
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSigningDocument(null);
              setSignedFile(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignDocument}
              disabled={!signedFile || uploadingSignedDoc}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploadingSignedDoc ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Confirm Signature'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
