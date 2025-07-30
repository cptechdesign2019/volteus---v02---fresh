'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

interface TinyMceEditorProps {
  value: string;
  onEditorChange: (content: string) => void;
  disabled?: boolean;
  onInit?: (evt: any, editor: any) => void;
  init?: Record<string, any>;
}

export function TinyMceEditor({ value, onEditorChange, disabled = false, onInit, init: customInit }: TinyMceEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY;

  useEffect(() => {
    // This runs only on the client
    setIsMounted(true);

    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  if (!isMounted) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  if (!apiKey) {
    return (
      <div className="flex items-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <AlertTriangle className="h-6 w-6" />
        <div className="flex-1">
          <h4 className="font-bold">TinyMCE API Key Missing</h4>
          <p className="text-sm">Please add <code>NEXT_PUBLIC_TINYMCE_API_KEY</code> to your <code>.env</code> file to enable the rich text editor.</p>
        </div>
      </div>
    );
  }

  const defaultInit = {
      menubar: false,
      plugins: [
        'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
        'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'help', 'wordcount', 'autoresize'
      ],
      toolbar: 'undo redo | blocks | ' +
        'bold italic forecolor | alignleft aligncenter ' +
        'alignright alignjustify | bullist numlist outdent indent | ' +
        'removeformat | help',
      content_style: 'body { font-family:Inter,sans-serif; font-size:14px; }',
      skin: isDarkMode ? 'oxide-dark' : 'oxide',
      content_css: isDarkMode ? 'dark' : 'default',
      autoresize_bottom_margin: 20,
      ...customInit,
  };

  return (
    <Editor
      apiKey={apiKey}
      value={value}
      onEditorChange={onEditorChange}
      onInit={onInit}
      disabled={disabled}
      init={defaultInit}
    />
  );
}
