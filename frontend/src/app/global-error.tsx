'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center px-4">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-2 text-gray-900">
              Critical Error
            </h1>
            <p className="text-gray-600 mb-2 max-w-md mx-auto">
              A critical error has occurred. Please try refreshing the page.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 mb-8">
                Error ID: {error.digest}
              </p>
            )}

            <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
