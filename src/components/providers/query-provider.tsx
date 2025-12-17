'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ReactNode, useState } from 'react';
import { get, set, del } from 'idb-keyval';

interface QueryProviderProps {
  children: ReactNode;
}

const createIDBPersister = (idbKey: string = 'reactQuery') => {
  return {
    persistClient: async (client: any) => {
      await set(idbKey, client);
    },
    restoreClient: async () => {
      return await get(idbKey);
    },
    removeClient: async () => {
      await del(idbKey);
    },
  };
};

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
          },
        },
      })
  );

  const [persister] = useState(() => createIDBPersister());

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}