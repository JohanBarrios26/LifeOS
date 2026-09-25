import { useSyncExternalStore } from "react";

const subscribeToNothing = () => () => {};

/**
 * False while the page is rendered on the server, true in the browser. For components that
 * read things only the browser has (localStorage, the device, whether the app is installed).
 */
export function useIsBrowser(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}
