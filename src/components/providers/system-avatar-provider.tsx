"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

type AvatarMessage = {
  id: string;
  text: string;
  type: "info" | "success" | "warning" | "error";
  duration?: number;
};

type SystemAvatarContextType = {
  say: (text: string, type?: AvatarMessage["type"], duration?: number) => void;
  message: AvatarMessage | null;
  dismiss: () => void;
};

const SystemAvatarContext = createContext<SystemAvatarContextType | undefined>(undefined);

export function useSystemAvatar() {
  const context = useContext(SystemAvatarContext);
  if (!context) {
    throw new Error("useSystemAvatar must be used within a SystemAvatarProvider");
  }
  return context;
}

export function SystemAvatarProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<AvatarMessage | null>(null);

  const dismiss = useCallback(() => {
    setMessage(null);
  }, []);

  const say = useCallback((text: string, type: AvatarMessage["type"] = "info", duration = 5000) => {
    const id = Math.random().toString(36).substring(7);
    setMessage({ id, text, type, duration });

    if (duration > 0) {
      setTimeout(() => {
        setMessage((current) => (current?.id === id ? null : current));
      }, duration);
    }
  }, []);

  return (
    <SystemAvatarContext.Provider value={{ say, message, dismiss }}>
      {children}
    </SystemAvatarContext.Provider>
  );
}
