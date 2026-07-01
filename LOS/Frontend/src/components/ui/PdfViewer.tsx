'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [baseScale, setBaseScale] = useState(1.0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const initialScaleSet = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Measure the viewer container to calculate fit scale
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setContainerSize({
      width: container.clientWidth,
      height: container.clientHeight
    });

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Compute baseScale to fit page exactly to container
  useEffect(() => {
    if (pdfDoc && containerSize.width && containerSize.height && !initialScaleSet.current) {
      const computeScale = async () => {
        try {
          const page = await pdfDoc.getPage(1);
          const unscaled = page.getViewport({ scale: 1.0 });
          // Deduct 64px for padding (p-8 is 32px on each side)
          const availableWidth = containerSize.width - 64;
          const availableHeight = containerSize.height - 64;
          
          const scaleX = availableWidth / unscaled.width;
          const scaleY = availableHeight / unscaled.height;
          
          const fit = Math.min(scaleX, scaleY);
          
          if (fit > 0.1) {
            setBaseScale(fit);
            initialScaleSet.current = true;
          }
        } catch (e) {
          console.error("Error computing fit scale", e);
        }
      };
      computeScale();
    }
  }, [pdfDoc, containerSize]);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Dynamically load PDF.js script to bypass Webpack/Next.js 15 build errors with pdfjs-dist
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load PDF.js script'));
            document.head.appendChild(script);
          });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setPageNumber(1);
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        setError(err.message || 'Failed to load PDF. Make sure Cloudinary allows public PDF delivery.');
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [url]);

  useEffect(() => {
    if (pdfDoc && canvasRef.current && initialScaleSet.current) {
      let isRenderCancelled = false;
      let renderTask: any = null;

      const renderPage = async () => {
        try {
          const page = await pdfDoc.getPage(pageNumber);
          if (isRenderCancelled) return;
          
          const renderScale = baseScale * zoomLevel;
          const devicePixelRatio = window.devicePixelRatio || 1;
          
          // Render at higher resolution for crispness on high DPI screens
          const viewport = page.getViewport({ scale: renderScale * devicePixelRatio });
          // Used for exact CSS layout bounds to fit the screen
          const cssViewport = page.getViewport({ scale: renderScale });
          
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // CSS style forces layout to match the container's fit scale while canvas holds high-res pixels
          canvas.style.width = `${cssViewport.width}px`;
          canvas.style.height = `${cssViewport.height}px`;

          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
          };
          
          renderTask = page.render(renderContext);
          await renderTask.promise;
        } catch (err: any) {
          if (err?.name === 'RenderingCancelledException') {
            // Expected when cancelling, ignore
          } else if (!isRenderCancelled) {
            console.error('Error rendering page:', err);
          }
        }
      };

      renderPage();

      return () => {
        isRenderCancelled = true;
        if (renderTask) {
          try {
            renderTask.cancel();
          } catch (e) {}
        }
      };
    }
  }, [pdfDoc, pageNumber, zoomLevel, baseScale]);

  return (
    <div className="flex flex-col h-full w-full bg-background border border-border/40 rounded-sm overflow-hidden shadow-sm">
      {/* Sleek Enterprise Toolbar */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border/40 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center min-w-[5rem] px-2 text-xs font-medium text-muted-foreground">
            {pageNumber} <span className="mx-1 text-muted-foreground/50">/</span> {numPages || '--'}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))}
            disabled={!numPages || pageNumber >= numPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border/40 shadow-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground" 
            onClick={() => setZoomLevel(z => z - 0.2)} 
            disabled={zoomLevel <= 0.5 || loading}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center min-w-[3.5rem] px-2 text-xs font-medium text-muted-foreground">
            {Math.round(zoomLevel * 100)}%
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground" 
            onClick={() => setZoomLevel(z => z + 0.2)} 
            disabled={zoomLevel >= 3 || loading}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Viewer Area */}
      <div 
        ref={containerRef}
        className="relative flex-1 overflow-auto bg-zinc-100/60 dark:bg-zinc-950/50 p-4 md:p-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/60 hover:[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        <div className="min-h-full flex items-center justify-center w-fit mx-auto min-w-full">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm font-medium text-muted-foreground">Loading document...</p>
            </div>
          )}
          
          {error && (
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto p-6 bg-background rounded-xl border border-destructive/20 shadow-sm text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-3" />
              <h3 className="text-sm font-semibold mb-1">Failed to load PDF</h3>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          )}
          
          <div className={cn(
            "relative transition-opacity duration-300 ease-out",
            loading ? "opacity-0" : "opacity-100",
            !error && "shadow-2xl ring-1 ring-border/10 rounded-sm bg-white"
          )}>
            <canvas 
              ref={canvasRef} 
              className="block max-w-none" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
