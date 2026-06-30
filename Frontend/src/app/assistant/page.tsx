'use client';

/**
 * /assistant route — redirects to the home page and opens the AI widget.
 * The primary AI experience is now the globally available floating widget.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAI } from '@/components/ai/AIProvider';

export default function AssistantRedirect() {
  const router = useRouter();
  const { open } = useAI();

  useEffect(() => {
    open();           // open the widget
    router.replace('/'); // go to landing page where widget is visible
  }, [open, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      color: '#475569',
      fontSize: '14px',
    }}>
      Opening Fortress AI…
    </div>
  );
}
