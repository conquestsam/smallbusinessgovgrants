import { useEffect } from 'react';

/**
 * Hook to warn user before navigating away with unsaved changes.
 * @param isDirty Whether the form has unsaved changes.
 */
export const useUnsavedChanges = (isDirty: boolean) => {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
};
