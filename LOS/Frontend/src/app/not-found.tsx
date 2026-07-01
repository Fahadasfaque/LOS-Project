'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 selection:bg-primary/10">
      {/* Decorative Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="relative max-w-md w-full text-center space-y-6 bg-card/45 backdrop-blur-sm border border-border/60 p-8 rounded-2xl shadow-xl">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/15 shadow-inner">
          <FileQuestion className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs font-extrabold tracking-widest text-primary uppercase bg-primary/5 border border-primary/10 px-3 py-1 rounded-full">
            Error 404
          </span>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight mt-3">
            Page Not Found
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">
            The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        <div className="border-t border-border/60 my-2"></div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex-1 h-10 font-bold border-border bg-background hover:bg-muted text-xs rounded-xl shadow-sm transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={() => router.push('/')}
            className="flex-1 h-10 font-bold bg-primary hover:bg-primary/95 text-primary-foreground text-xs rounded-xl shadow transition-all"
          >
            <Home className="mr-2 h-4 w-4" />
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
