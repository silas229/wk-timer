"use client";

import { useState, useEffect } from "react";

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const checkStandalone = () => {
      if (typeof globalThis !== "undefined") {
        const standalone =
          globalThis.matchMedia("(display-mode: standalone)").matches ||
          (globalThis.navigator as Navigator & { standalone?: boolean })
            .standalone ||
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

    globalThis.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );
    globalThis.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      globalThis.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      globalThis.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return {
    isInstalled,
    isStandalone,
    canInstall,
  };
}
