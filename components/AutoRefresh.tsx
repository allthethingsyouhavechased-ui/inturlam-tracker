"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Sayfayı arka planda periyodik olarak tazeler, böylece başka birinin
 * yaptığı değişiklik F5'e gerek kalmadan birkaç saniye içinde görünür.
 * Gerçek zamanlı push değil (WebSocket yok) — pragmatik bir orta yol.
 */
export default function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
