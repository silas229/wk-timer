"use client";

import { useState, useEffect } from "react";

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const checkStandalone = () => {
      if (typeof window !== "undefined") {
        const standalone =
          window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as any).standalone ||
          document.referrer.includes("android-app://");
        setIsStandalone(standalone);
        setIsInstalled(standalone);
      }
    };

    // Check if app can be installed
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    checkStandalone();

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return {
    isInstalled,
    isStandalone,
    canInstall,
  };
}
