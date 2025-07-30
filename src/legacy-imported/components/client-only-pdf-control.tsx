// src/components/client-only-pdf-control.tsx
'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Quote, QuoteOption } from '@/lib/types';

interface ClientOnlyPdfControlProps {
  quote: Quote;
  option: QuoteOption;
}

export function ClientOnlyPdfControl({ quote, option }: ClientOnlyPdfControlProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote, option }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const { url } = await response.json();
      window.open(url, '_blank');
      
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={isGenerating}>
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isGenerating ? 'Generating...' : 'Download PDF'}
    </Button>
  );
}
