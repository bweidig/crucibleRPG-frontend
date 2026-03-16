'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from './api';

// Hook for protected pages — redirects to /auth if no token
export function useAuth() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth');
    } else {
      setChecked(true);
    }
  }, [router]);

  return checked;
}
