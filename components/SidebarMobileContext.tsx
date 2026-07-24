"use client";

import { createContext, useContext, useState } from "react";

interface SidebarMobileState {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const Ctx = createContext<SidebarMobileState | null>(null);

export function SidebarMobileProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Ctx.Provider
      value={{ open, toggle: () => setOpen((o) => !o), close: () => setOpen(false) }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSidebarMobile(): SidebarMobileState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSidebarMobile, SidebarMobileProvider içinde kullanılmalı.");
  return ctx;
}
