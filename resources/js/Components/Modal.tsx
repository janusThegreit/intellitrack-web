import React from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeButton?: boolean;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeButton = true,
}: ModalProps) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={clsx('relative my-auto flex max-h-[calc(100vh-2rem)] w-full flex-col rounded-xl border border-border-default bg-surface-card shadow-2xl', sizes[size])} role="dialog" aria-modal="true" aria-label={title}>
        {/* Header */}
        {(title || closeButton) && (
          <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-5 py-4">
            {title && <h2 className="text-lg font-semibold text-content-primary">{title}</h2>}
            {closeButton && (
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-content-secondary transition-colors hover:bg-surface-input hover:text-content-primary"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="min-h-0 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-border-subtle bg-surface-app px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const variantColors = {
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-error-100 text-error-800',
    info: 'bg-primary-100 text-primary-800',
  };

  const confirmButtonVariant = {
    warning: 'secondary',
    danger: 'danger',
    info: 'primary',
  } as const;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm">
      <div className="flex flex-col gap-4">
        <div className={clsx('p-3 rounded-lg', variantColors[variant])}>
          <p className="font-medium">{message}</p>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg bg-surface-input px-4 py-2 text-sm font-medium text-content-secondary hover:bg-border-subtle disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx( 'rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50',
              confirmButtonVariant[variant] === 'danger'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : confirmButtonVariant[variant] === 'secondary'
                  ? 'bg-surface-input hover:bg-border-subtle text-content-primary'
                  : 'bg-brand hover:bg-brand/90 text-brand-content'
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export { Modal, ConfirmDialog };
export default Modal;
