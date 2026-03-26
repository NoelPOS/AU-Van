"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/context/notification.context";
import { getQueryClient } from "@/lib/query-client";

type Props = {
  children?: React.ReactNode;
};

export const Provider = ({ children }: Props) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
};
