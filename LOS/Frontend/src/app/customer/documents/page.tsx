'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FolderOpen,
  Spinner,
  CheckCircle,
  Clock,
  XCircle,
  UploadSimple,
  DownloadSimple,
  Warning,
} from '@phosphor-icons/react';

interface Document {
  id: string;
  documentType: string;
  originalName: string;
  secureUrl: string;
  verificationStatus: string;
  uploadedAt: string;
}

interface Application {
  id: string;
  applicationNumber: string;
  status: string;
  documents: Document[];
}

const REQUIRED_DOC_TYPES = ['AADHAAR', 'PAN', 'INCOME_PROOF', 'BANK_STATEMENT'];

export default function CustomerDocumentsPage() {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');

  const fetchDocs = async () => {
    try {
      const res = await api.get('/customer/applications');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const detailRes = await api.get(`/customer/applications/${res.data[0].id}`);
        if (detailRes.success) setApp(detailRes.data);
      }
    } catch {
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleFileUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB. Please choose a smaller file.');
      return;
    }

    setUploadingDocType(docType);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', app!.id);
    formData.append('documentType', docType);

    try {
      const res = await api.postFormData('/customer/documents', formData);
      if (res.success) {
        await fetchDocs();
      } else {
        setUploadError(res.message || 'Upload failed. Please try again.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload document.');
    } finally {
      setUploadingDocType(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!app) {
    return (
      <Card className="border-border">
        <CardContent className="p-12 text-center">
          <FolderOpen className="h-14 w-14 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-foreground mb-1">No Active Application</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Documents will appear here once your Loan Officer creates an application for you.
          </p>
        </CardContent>
      </Card>
    );
  }

  const rejectedDocs = app.documents.filter((d) => d.verificationStatus === 'REJECTED');
  const verifiedCount = app.documents.filter((d) => d.verificationStatus === 'VERIFIED').length;
  const uploadedCount = app.documents.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Document Vault</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Application <span className="font-mono font-semibold text-foreground">{app.applicationNumber}</span> · Max file size: 5MB per document
        </p>
      </div>

      {/* Alerts */}
      {rejectedDocs.length > 0 && (
        <Alert variant="destructive">
          <Warning className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            {rejectedDocs.length} document{rejectedDocs.length > 1 ? 's have' : ' has'} been rejected.
            Please re-upload to avoid delays in processing your application.
          </AlertDescription>
        </Alert>
      )}
      {uploadError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <FolderOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Required</p>
                <p className="text-lg font-bold text-foreground leading-tight">{REQUIRED_DOC_TYPES.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Uploaded</p>
                <p className="text-lg font-bold text-foreground leading-tight">{uploadedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Verified</p>
                <p className="text-lg font-bold text-foreground leading-tight">{verifiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card className="border-border">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-bold">Required Documents</CardTitle>
          <p className="text-xs text-muted-foreground">Accepted formats: PDF, JPG, JPEG, PNG. Max size: 5MB</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Document Type</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide">File Name</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Uploaded On</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {REQUIRED_DOC_TYPES.map((type) => {
                  const doc = app.documents.find((d) => d.documentType === type);
                  const isVerified = doc?.verificationStatus === 'VERIFIED';
                  const isRejected = doc?.verificationStatus === 'REJECTED';
                  const isPending = doc && !isVerified && !isRejected;

                  return (
                    <TableRow key={type} className="hover:bg-muted/30 border-border/50">
                      <TableCell className="text-xs font-semibold text-foreground py-4">
                        {type.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-4 max-w-[200px]">
                        {doc ? (
                          <span className="truncate block" title={doc.originalName}>{doc.originalName}</span>
                        ) : (
                          <span className="italic text-muted-foreground/60">Not uploaded</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-4">
                        {doc
                          ? new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </TableCell>
                      <TableCell className="py-4">
                        {!doc ? (
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            Required
                          </Badge>
                        ) : isVerified ? (
                          <Badge variant="outline" className="text-[10px] border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" weight="fill" /> Verified
                          </Badge>
                        ) : isRejected ? (
                          <Badge variant="destructive" className="text-[10px]">
                            <XCircle className="h-3 w-3 mr-1" weight="fill" /> Rejected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/10 text-primary">
                            <Clock className="h-3 w-3 mr-1" weight="fill" /> Under Review
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {doc && (
                            <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1">
                              <a href={doc.secureUrl} target="_blank" rel="noreferrer">
                                <DownloadSimple className="h-3 w-3" /> View
                              </a>
                            </Button>
                          )}
                          {!isVerified && (
                            <label className="relative inline-flex cursor-pointer">
                              <Button
                                size="sm"
                                variant={isRejected ? 'destructive' : 'default'}
                                className="h-7 text-xs gap-1 pointer-events-none"
                                disabled={uploadingDocType !== null}
                              >
                                {uploadingDocType === type ? (
                                  <Spinner className="h-3 w-3 animate-spin" />
                                ) : (
                                  <UploadSimple className="h-3 w-3" />
                                )}
                                {doc ? 'Replace' : 'Upload'}
                              </Button>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileUpload(type, e)}
                                disabled={uploadingDocType !== null}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </label>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
