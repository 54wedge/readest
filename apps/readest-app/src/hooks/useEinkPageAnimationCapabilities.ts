import { useEffect, useState } from 'react';
import { useEnv } from '@/context/EnvContext';
import type { EinkPageAnimationCapabilities } from '@/utils/bridge';
import {
  checkEinkPageAnimationCapabilities,
  getCachedEinkPageAnimationCapabilities,
} from '@/utils/bridge';

// A rejection means the probe was inconclusive (e.g. the bridge not ready at
// first mount), not that the panel lacks the API — retry a bounded number of
// times so a permanently failing command can't spin.
const MAX_PROBE_RETRIES = 3;
const PROBE_RETRY_DELAY_MS = 400;

/**
 * The page-turn effect options this Android panel supports, or null until the
 * probe settles. Like full refresh, support comes from a read-only native
 * probe; a device without the panel API keeps the generic animation rows.
 */
export function useEinkPageAnimationCapabilities(): EinkPageAnimationCapabilities | null {
  const { appService } = useEnv();
  const [capabilities, setCapabilities] = useState(getCachedEinkPageAnimationCapabilities());

  useEffect(() => {
    if (!appService?.isAndroidApp) return;
    const settled = getCachedEinkPageAnimationCapabilities();
    if (settled) {
      setCapabilities(settled);
      return;
    }
    let active = true;
    let retries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const probe = () => {
      checkEinkPageAnimationCapabilities().then(() => {
        if (!active) return;
        // The probe resolves an unsupported capability set for both a
        // confirmed negative and an inconclusive read; only a settled cache
        // tells them apart, and a still-empty one means we should retry.
        const now = getCachedEinkPageAnimationCapabilities();
        if (now) {
          setCapabilities(now);
        } else if (retries < MAX_PROBE_RETRIES) {
          retries++;
          timer = setTimeout(probe, PROBE_RETRY_DELAY_MS);
        }
      });
    };
    probe();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [appService]);

  return capabilities;
}
