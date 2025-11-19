// components/Modal.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string; // optional additional classes for dialog
};

export default function Modal({ open, onClose, title, children, className = '' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const prevActiveEl = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    // remember previous focused element
    prevActiveEl.current = document.activeElement;

    // lock scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // focus the dialog
    window.setTimeout(() => {
      dialogRef.current?.focus();
    }, 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      // restore focus
      try {
        (prevActiveEl.current as HTMLElement | null)?.focus?.();
      } catch {}
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      aria-label={title ?? 'Dialog'}
      className="fixed inset-0 z-[99999] flex items-center justify-center"
    >
      {/* backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative z-[100000] w-full max-w-md mx-4 bg-white rounded shadow-2xl p-6 ${className}`}
        role="document"
        style={{ outline: 'none' }}
      >
        {title ? <h2 className="text-lg font-semibold mb-3">{title}</h2> : null}
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}
