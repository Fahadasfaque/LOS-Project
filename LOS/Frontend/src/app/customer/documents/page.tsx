'use client';

/**
 * @file page.tsx (/customer/documents)
 * @description Dedicated customer Document Vault.
 *
 * Provides a clean overview of all required documents for the customer's active loan application.
 * Shows upload/replace capability, verification status badges, and download links.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import {
  FolderOpen,
  Spinner,
  CheckCircle,
  Clock,
  XCircle,
  UploadSimple,
  DownloadSimple,
  Warning,
  ArrowRight,
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
        // Fetch detailed version which contains documents
        const detailRes = await api.get(`/customer/applications/${res.data[0].id}`);
        if (detailRes.success) {
          setApp(detailRes.data);
        }
      }
    } catch {
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !app) return;

    setUploadingDocType(docType);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', app.id);
    formData.append('documentType', docType);

    try {
      const res = await api.postFormData('/customer/documents', formData);
      if (res.success) {
        await fetchDocs();
      } else {
        setUploadError(res.message || 'Upload failed.');
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

  const requiredTypes = ['PAN', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Document Vault</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Upload and manage your required verification documents for loan processing.
        </p>
      </div>

      {uploadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 flex items-center gap-2">
          <Warning className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive">{uploadError}</p>
        </div>
      )}

      {!app ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FolderOpen className="h-16 w-16 text-muted-foreground/60 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-foreground mb-1">No Active Applications</h3>
          <p className="text-xs text-muted-foreground">
            You do not have any active applications. Document upload will be enabled once your application is initialized.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Application Info */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <p className="text-xs font-bold text-foreground">
                Active Application: <span className="font-mono">{app.applicationNumber}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ensure all four required documents are uploaded to avoid delays in review.
              </p>
            </div>
            <Link
              href={`/customer/applications/${app.id}`}
              className="flex h-8 px-3 items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-colors w-fit"
            >
              <span>Track Application</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Document List */}
          <div className="grid gap-3">
            {requiredTypes.map((type) => {
              const doc = app.documents.find((d) => d.documentType === type);
              const isVerified = doc?.verificationStatus === 'VERIFIED';
              const isPending = doc?.verificationStatus === 'PENDING';
              const isRejected = doc?.verificationStatus === 'REJECTED';

              return (
                <div
                  key={type}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card"
                >
                  {/* Left info */}
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">{type.replace(/_/g, ' ')} Card / Statement</p>
                    {doc ? (
                      <p className="text-[11px] text-muted-foreground truncate" title={doc.originalName}>
                        File: {doc.originalName}
                      </p>
                    ) : (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                        <Warning className="h-3.5 w-3.5" /> Awaiting upload
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 self-end sm:self-center">
                    {/* Status Badge */}
                    {doc && (
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold border ${
                          isVerified
                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : isRejected
                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}
                      >
                        {isVerified ? (
                          <CheckCircle className="h-3 w-3" weight="fill" />
                        ) : isRejected ? (
                          <XCircle className="h-3 w-3" weight="fill" />
                        ) : (
                          <Clock className="h-3 w-3" weight="fill" />
                        )}
                        {doc.verificationStatus}
                      </span>
                    )}

                    {/* View File */}
                    {doc && (
                      <a
                        href={doc.secureUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-8 px-2.5 items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs text-foreground cursor-pointer transition-colors"
                      >
                        <DownloadSimple className="h-3.5 w-3.5" />
                        <span>View</span>
                      </a>
                    )}

                    {/* Upload / Replace Action */}
                    {!isVerified && (
                      <label className="relative flex h-8 px-3 items-center justify-center gap-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold cursor-pointer select-none transition-colors active:scale-95">
                        {uploadingDocType === type ? (
                          <Spinner className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UploadSimple className="h-3.5 w-3.5" />
                        )}
                        <span>{doc ? 'Replace' : 'Upload'}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(type, e)}
                          disabled={uploadingDocType !== null}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
