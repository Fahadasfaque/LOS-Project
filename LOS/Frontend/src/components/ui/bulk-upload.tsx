'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  UploadSimple,
  FileCsv,
  WarningCircle,
  CheckCircle,
  CircleNotch,
  DownloadSimple,
  X
} from '@phosphor-icons/react';
import { api } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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
    ? 'firstName,lastName,email,password,role\nJohn,Doe,john.doe@fortress.com,SecurePass123,LOAN_OFFICER\nJane,Smith,jane.smith@fortress.com,SecurePass123,CREDIT_ANALYST'
    : 'applicantName,email,phone,pan,loanType,loanAmount,monthlyIncome,employmentType\nAlice Johnson,alice@example.com,9876543210,ABCDE1234F,PERSONAL,500000,60000,SALARIED\nBob Miller,bob@example.com,9123456789,XYZAB5678C,BUSINESS,1200000,85000,BUSINESS_OWNER';

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

      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1);

      const parsed = dataRows.map((row, idx) => {
        const values = row.split(',').map(v => v.trim());
        if (values.length !== headers.length) {
          throw new Error(`Data row ${idx + 1} does not match header column count.`);
        }

        const obj: any = {};
        headers.forEach((header, index) => {
          let value: any = values[index];
          if (header === 'loanAmount' || header === 'monthlyIncome') {
            value = parseFloat(value);
            if (isNaN(value)) {
              throw new Error(`Row ${idx + 1}: ${header} must be a number.`);
            }
          }
          obj[header] = value;
        });
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
      setErrorMsg(err.message || 'Bulk upload connection error.');
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
      <DialogContent className="p-0 gap-0 sm:max-w-2xl overflow-hidden border-border bg-card text-card-foreground shadow-2xl sm:rounded-lg">
        {/* Header section */}
        <div className="bg-muted/30 px-6 py-5 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shrink-0 shadow-sm">
              <FileCsv className="h-5.5 w-5.5" weight="bold" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold tracking-tight text-foreground">
                Bulk Import {type === 'users' ? 'Users' : 'Applications'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs mt-0.5 font-medium leading-relaxed">
                Upload a CSV file containing multiple records to import in batch.
              </DialogDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={downloadTemplate}
            className="border-border hover:bg-muted text-foreground flex items-center gap-1.5 font-bold cursor-pointer h-9 px-3 shadow-sm shrink-0"
          >
            <DownloadSimple className="h-4 w-4" weight="bold" />
            Download Demo Template
          </Button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-4">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
              <WarningCircle className="h-4.5 w-4.5 shrink-0 text-destructive mt-0.5" weight="fill" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 rounded text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600 mt-0.5" weight="fill" />
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
              className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-3.5 cursor-pointer transition-all ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30 bg-card'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleChange}
              />
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/15 shadow-sm">
                <UploadSimple className="h-5.5 w-5.5" weight="bold" />
              </div>
              <div className="text-center select-none">
                <p className="text-sm font-bold text-foreground">Drag and drop your file here, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Supports CSV files only up to 5MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File Box */}
              <div className="border border-border rounded p-3 bg-muted/25 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                    <FileCsv className="h-5 w-5" weight="bold" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{(file.size / 1024).toFixed(1)} KB — {parsedData.length} records parsed</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  className="text-xs border-border hover:bg-muted font-bold text-foreground cursor-pointer h-8 px-2.5"
                >
                  Clear File
                </Button>
              </div>

              {/* Data Preview Table */}
              {parsedData.length > 0 && (
                <div className="border border-border rounded overflow-hidden shadow-sm">
                  <div className="bg-muted/40 px-3 py-2 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                    Parsed CSV Data Preview (First 5 Rows)
                  </div>
                  <div className="overflow-y-hidden overflow-x-auto max-h-[190px]">
                    <table className="w-full text-left border-collapse text-xs select-none">
                      <thead>
                        <tr className="bg-muted/10 border-b border-border text-muted-foreground">
                          {Object.keys(parsedData[0]).map((key) => (
                            <th key={key} className="px-3 py-2.5 font-bold uppercase tracking-wider">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="border-b border-border/50 text-foreground hover:bg-muted/5">
                            {Object.values(row).map((val: any, cellIdx) => (
                              <td key={cellIdx} className="px-3 py-2 font-semibold font-mono">{String(val)}</td>
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
        <div className="bg-muted/30 px-6 py-4 border-t border-border flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border text-foreground hover:bg-muted cursor-pointer font-bold h-10 px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading || parsedData.length === 0}
            onClick={handleUpload}
            className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold flex items-center gap-1.5 cursor-pointer shadow h-10 px-6"
          >
            {loading ? (
              <>
                <CircleNotch className="h-4.5 w-4.5 animate-spin" />
                Importing...
              </>
            ) : (
              `Import ${parsedData.length} Records`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
