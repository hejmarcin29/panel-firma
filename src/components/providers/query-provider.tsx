'use client';

import { QueryClient, MutationCache } from '@tanstack/react-query';
import { PersistQueryClientProvider, PersistedClient } from '@tanstack/react-query-persist-client';
import { ReactNode, useState } from 'react';
import { get, set, del } from 'idb-keyval';

interface QueryProviderProps {
  children: ReactNode;
}

const createIDBPersister = (idbKey: string = 'reactQuery') => {
  return {
    persistClient: async (client: PersistedClient) => {
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
        mutationCache: new MutationCache({
          onSuccess: () => {
            // Invalidate relevant queries on success if needed globally
          },
        }),
      })
  );

  const [persister] = useState(() => createIDBPersister());

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24,
        dehydrateOptions: {
          shouldDehydrateMutation: (mutation) => {
            // Persist all paused mutations (offline changes)
            return mutation.state.isPaused;
          },
          shouldDehydrateQuery: (query) => {
            const defaultShouldDehydrate = query.state.status === 'success';
            return defaultShouldDehydrate;
          },
        },
      }}
      onSuccess={() => {
        // Resume mutations after hydration
        queryClient.resumePausedMutations().then(() => {
          console.log('Mutations resumed');
        });
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}