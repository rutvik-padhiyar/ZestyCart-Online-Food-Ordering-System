const CACHE_RESET_KEY = "zestycart-cache-reset-v1";

export async function clearRuntimeCaches() {
  if (typeof window === "undefined") {
    return;
  }

  const alreadyReset = sessionStorage.getItem(CACHE_RESET_KEY);
  if (alreadyReset) {
    return;
  }

  sessionStorage.setItem(CACHE_RESET_KEY, "true");

  if ("caches" in window) {
    try {
      const cacheKeys = await window.caches.keys();
      await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
    } catch (error) {
      console.warn("Failed to clear browser caches", error);
    }
  }

  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch (error) {
      console.warn("Failed to unregister service workers", error);
    }
  }
}
