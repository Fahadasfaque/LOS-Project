'use client';

/**
 * AIShell — rendered inside the root layout.
 * Provides the global AI context + floating button + widget + fullscreen overlay.
 * Must be a Client Component because it uses context and browser APIs.
 */
import { AIProvider } from '@/components/ai/AIProvider';
import { AIFloatingButton } from '@/components/ai/AIFloatingButton';
import { AIWidget } from '@/components/ai/AIWidget';
import { AIFullscreen } from '@/components/ai/AIFullscreen';

export function AIShell({ children }: { children: React.ReactNode }) {
  return (
    <AIProvider>
      {children}
      <AIFloatingButton />
      <AIWidget />
      <AIFullscreen />
    </AIProvider>
  );
}
