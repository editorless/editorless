"use client";

import React, { useRef } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

export default function ReactQueryProvider({ children }: React.PropsWithChildren) {
  const clientRef = useRef(
    new QueryClient({ defaultOptions: { queries: { retry: 0 } } })
  );

  return (
    <QueryClientProvider client={clientRef.current}>
      {children}
    </QueryClientProvider>
  );
}
