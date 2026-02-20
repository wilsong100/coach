import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      cacheTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// TODO: wrap `QueryClientProvider` in the app root and add React Query DevTools
// once `@tanstack/react-query-devtools` is installed.
