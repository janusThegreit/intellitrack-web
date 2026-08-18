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
      <div className={clsx('relative my-auto flex max-h-[calc(100vh-2rem)] w-full flex-col bg-white rounded-xl shadow-2xl dark:bg-[#1b1b1b]', sizes[size])} role="dialog" aria-modal="true" aria-label={title}>
        {/* Header */}
        {(title || closeButton) && (
          <div className="flex shrink-0 items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-white/10">
            {title && <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h2>}
            {closeButton && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="min-h-0 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-[#202020]">
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
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-200 rounded-lg hover:bg-neutral-300 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50',
              confirmButtonVariant[variant] === 'danger'
                ? 'bg-error-600 hover:bg-error-700'
                : confirmButtonVariant[variant] === 'secondary'
                ? 'bg-neutral-600 hover:bg-neutral-700'
                : 'bg-primary-600 hover:bg-primary-700'
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
