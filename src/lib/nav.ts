import { router } from "expo-router";

/**
 * Pop the current screen, falling back to Home when there's no history to pop
 * (deep-links and cold-starts have an empty back stack, which makes a bare
 * `router.back()` emit a "GO_BACK was not handled" warning).
 */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}
