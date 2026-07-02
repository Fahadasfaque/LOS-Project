'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  UploadIcon,
  FileTextIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  DownloadIcon,
  XIcon
} from 'lucide-react';
import { api } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface BulkUploadProps {
  type: 'users' | 'applications';
  onSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkUpload({ type, onSuccess, open, onOpenChange }: BulkUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const csvTemplate = type === 'users'
    ? 'First Name,Last Name,Email,Role\nJohn,Doe,john.doe@fortress.com,LOAN_OFFICER\nJane,Smith,jane.smith@fortress.com,CREDIT_ANALYST'
    : 'Applicant Name,Email,Phone,PAN,Loan Type,Loan Amount,Monthly Income,Employment Type\nAlice Johnson,alice@example.com,9876543210,ABCDE1234F,PERSONAL,500000,60000,SALARIED\nBob Miller,bob@example.com,9123456789,XYZAB5678C,BUSINESS,1200000,85000,BUSINESS_OWNER';

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bulk_${type}_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const parseCSV = (text: string) => {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length < 2) {
        throw new Error('CSV file is empty or missing data rows.');
      }

      const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const headers = rawHeaders.map(h => {
        const lower = h.toLowerCase();
        if (lower === 'first name') return 'firstName';
        if (lower === 'last name') return 'lastName';
        if (lower === 'email') return 'email';
        if (lower === 'role') return 'role';
        if (lower === 'password') return 'password';
        if (lower === 'applicant name') return 'applicantName';
        if (lower === 'phone') return 'phone';
        if (lower === 'pan') return 'pan';
        if (lower === 'loan type') return 'loanType';
        if (lower === 'loan amount') return 'loanAmount';
        if (lower === 'monthly income') return 'monthlyIncome';
        if (lower === 'employment type') return 'employmentType';
        return h; // fallback
      });

      const dataRows = lines.slice(1);

      const parsed = dataRows.map((row, idx) => {
        // Simple CSV split (note: doesn't handle commas inside quotes well, but sufficient for this demo format)
        const values = row.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        
        // Some rows might have empty trailing columns, but we just map up to headers length
        const obj: any = {};
        headers.forEach((header, index) => {
          let value: any = values[index] !== undefined ? values[index] : '';
          
          if (header === 'loanAmount' || header === 'monthlyIncome') {
            value = parseFloat(value);
            if (isNaN(value)) {
              throw new Error(`Row ${idx + 1}: ${header} must be a number.`);
            }
          }
          if (header === 'role' && typeof value === 'string') {
            value = value.toUpperCase().replace(/[\s-]+/g, '_'); // Normalize role to match backend enum
            
            // Map common variations to exact enum values
            if (value.includes('ADMIN')) value = 'SUPER_ADMIN';
            else if (value.includes('OFFICER') || value === 'RM') value = 'LOAN_OFFICER';
            else if (value.includes('ANALYST') || value.includes('RISK') || value.includes('CREDIT')) value = 'CREDIT_ANALYST';
            else if (value.includes('APPROVER') || value.includes('EXEC')) value = 'APPROVER';
            else if (value === 'REQUESTER' || value === 'USER') value = 'CUSTOMER';
            
            // Fallback for completely unknown roles in dummy data
            const validRoles = ['SUPER_ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'APPROVER', 'CUSTOMER'];
            if (!validRoles.includes(value)) {
              value = 'CUSTOMER';
            }
          }
          obj[header] = value;
        });

        if (type === 'users' && !obj.password) {
          obj.password = 'Welcome@123'; // Default password if omitted
        }

        return obj;
      });

      setParsedData(parsed);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse CSV file.');
      setParsedData([]);
      setFile(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            parseCSV(event.target.result as string);
          }
        };
        reader.readAsText(droppedFile);
      } else {
        setErrorMsg('Only CSV files (.csv) are supported for bulk upload.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            parseCSV(event.target.result as string);
          }
        };
        reader.readAsText(selectedFile);
      } else {
        setErrorMsg('Only CSV files (.csv) are supported for bulk upload.');
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const endpoint = type === 'users' ? '/users/bulk' : '/applications/bulk';
      const res = await api.post(endpoint, parsedData);

      if (res.success) {
        setSuccessMsg(`Successfully imported ${parsedData.length} records.`);
        setFile(null);
        setParsedData([]);
        onSuccess();
        setTimeout(() => {
          onOpenChange(false);
          setSuccessMsg(null);
        }, 2000);
      } else {
        setErrorMsg(res.message || 'Bulk upload failed.');
      }
    } catch (err: any) {
      let msg = err.message || 'Bulk upload connection error.';
      if (Array.isArray(err.errors) && err.errors.length > 0) {
        msg += ': ' + err.errors.map((e: any) => `${e.field ? e.field + ' - ' : ''}${e.message}`).join(', ');
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <Dialog open={!!open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="p-0 gap-0 sm:max-w-2xl overflow-hidden border-border bg-card text-card-foreground sm:rounded-lg flex flex-col max-h-[90dvh]">
        {/* Header section */}
        <div className="px-6 py-5 border-b flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border text-foreground shrink-0">
              <FileTextIcon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-semibold text-foreground">
                Bulk Import {type === 'users' ? 'Users' : 'Applications'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Upload a CSV file containing multiple records to import in batch.
              </DialogDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={downloadTemplate}
            className="shrink-0 flex items-center gap-2"
          >
            <DownloadIcon className="h-4 w-4" />
            Download Demo Template
          </Button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm font-medium flex items-start gap-2.5">
              <AlertCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-md text-sm font-medium flex items-start gap-2.5">
              <CheckCircle2Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Upload and Drag & Drop or Preview area */}
          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              className={cn(
                'border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors',
                dragActive ? 'border-foreground bg-accent' : 'border-border hover:bg-accent/50'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleChange}
              />
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border text-foreground">
                <UploadIcon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Drag and drop your file here, or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">Supports CSV files only up to 5MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File Box */}
              <div className="border rounded-lg p-4 bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-md bg-background flex items-center justify-center border text-foreground shrink-0">
                    <FileTextIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024).toFixed(1)} KB — {parsedData.length} records parsed</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  className="h-8 px-3"
                >
                  Clear File
                </Button>
              </div>

              {/* Data Preview Table */}
              {parsedData.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 border-b text-xs font-medium text-muted-foreground">
                    Data Preview (First 5 Rows)
                  </div>
                  <div className="overflow-auto max-h-[200px]">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {Object.keys(parsedData[0]).map((key) => (
                            <th key={key} className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            {Object.values(row).map((val: any, cellIdx) => (
                              <td key={cellIdx} className="px-4 py-3 whitespace-nowrap">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-muted/20">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading || parsedData.length === 0}
            onClick={handleUpload}
            className="min-w-[140px]"
          >
            {loading ? (
              <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" />Importing...</>
            ) : (
              `Import ${parsedData.length} Records`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

