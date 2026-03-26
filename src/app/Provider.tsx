"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/context/notification.context";

type Props = {
  children?: React.ReactNode;
};

export const Provider = ({ children }: Props) => {
  return (
    <SessionProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </SessionProvider>
  );
};
