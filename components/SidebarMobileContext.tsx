"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface SidebarMobileState {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const Ctx = createContext<SidebarMobileState | null>(null);

export function SidebarMobileProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, toggle, close }), [open, toggle, close]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSidebarMobile(): SidebarMobileState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSidebarMobile, SidebarMobileProvider içinde kullanılmalı.");
  return ctx;
}
