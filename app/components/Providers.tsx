"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TRPCProvider } from "@/lib/trpc/provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>
        {children}
        <Toaster />
      </TRPCProvider>
    </SessionProvider>
  );
}
