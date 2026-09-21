import React, { useState, useEffect } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  variant?: 'default' | 'destructive';
  title: string;
  description?: string;
  checkboxLabel?: string;
  checkboxDefaultChecked?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (checkboxValue?: boolean) => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  variant = 'default',
  title,
  description,
  checkboxLabel,
  checkboxDefaultChecked = false,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
}) => {
  const [checked, setChecked] = useState(checkboxDefaultChecked);
  
  useEffect(() => {
    setChecked(checkboxDefaultChecked);
  }, [isOpen, checkboxDefaultChecked]);

  if (!isOpen) return null;

  const iconMap = {
    default: (
      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    destructive: (
      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">{iconMap[variant]}</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 mb-6">
                {description}
              </p>
            )}
            {checkboxLabel && (
              <label className="flex items-start gap-3 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{checkboxLabel}</span>
              </label>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end mt-6">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            onClick={() => {
              onConfirm(checkboxLabel ? checked : undefined);
              onCancel();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
