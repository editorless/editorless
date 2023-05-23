"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";
import { useRef } from "react";

export default function LoadGit() {
  const clientRef = useRef<QueryClient>(new QueryClient());

  const { isLoading, error, data } = useQuery(["git", "init"], async () =>
    axios.post("/api/git/init", {}, { withCredentials: true })
  );

  console.log(error, data);

  return (
    <QueryClientProvider client={clientRef.current}>
      <h1 className="text-2xl font-bold text-center">
        {isLoading ? "Loading..." : "Loaded"}
      </h1>
    </QueryClientProvider>
  );
}
