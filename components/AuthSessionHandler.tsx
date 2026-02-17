"use client";

import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

export default function AuthSessionHandler() {
  const [showSessionModal, setShowSessionModal] = React.useState(false);
  const [showForbiddenModal, setShowForbiddenModal] = React.useState(false);
  const [forbiddenMessage, setForbiddenMessage] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const handleSessionInvalid = () => setShowSessionModal(true);
    const handleForbidden = (e: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail;
        setForbiddenMessage(detail?.message || 'You do not have permission to perform this action.');
      } catch {
        setForbiddenMessage('You do not have permission to perform this action.');
      }
      setShowForbiddenModal(true);
    };

    window.addEventListener('auth:session-invalid', handleSessionInvalid);
    window.addEventListener('auth:forbidden', handleForbidden as EventListener);

    return () => {
      window.removeEventListener('auth:session-invalid', handleSessionInvalid);
      window.removeEventListener('auth:forbidden', handleForbidden as EventListener);
    };
  }, []);

  return (
    <>
      <Dialog open={showSessionModal} onOpenChange={(open) => setShowSessionModal(open as boolean)}>
        <DialogContent>
          <DialogTitle>Session expired</DialogTitle>
          <DialogDescription>
            Your session has expired or is invalid. Please sign in again to continue.
          </DialogDescription>
          <div className="mt-4 flex gap-2 justify-end">
            <button
              className="px-3 py-1 rounded bg-gray-200"
              onClick={() => setShowSessionModal(false)}
            >
              Dismiss
            </button>
            <button
              className="px-3 py-1 rounded bg-emerald-600 text-white"
              onClick={() => {
                setShowSessionModal(false);
                router.push('/login');
              }}
            >
              Go to Login
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForbiddenModal} onOpenChange={(open) => setShowForbiddenModal(open as boolean)}>
        <DialogContent>
          <DialogTitle>Insufficient permissions</DialogTitle>
          <DialogDescription>
            {forbiddenMessage}
          </DialogDescription>
          <div className="mt-4 flex gap-2 justify-end">
            <button
              className="px-3 py-1 rounded bg-emerald-600 text-white"
              onClick={() => setShowForbiddenModal(false)}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
