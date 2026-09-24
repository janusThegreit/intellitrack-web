import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

interface SessionTimeoutManagerProps {
  /**
   * Total inactivity timeout in milliseconds (defaults to 5 minutes = 300,000 ms).
   */
  timeoutMs?: number;
  /**
   * Warning threshold in milliseconds before timeout when modal appears (defaults to 60,000 ms / 1 minute).
   */
  warningDurationMs?: number;
}

export default function SessionTimeoutManager({
  timeoutMs = 5 * 60 * 1000, // 5 minutes
  warningDurationMs = 60 * 1000, // 1 minute warning
}: SessionTimeoutManagerProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [isExtending, setIsExtending] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

  const handleLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      await fetch('/logout', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
    } catch {
      // Continue to redirect even if network request fails
    } finally {
      window.location.href = '/login?timeout=1';
    }
  }, [csrfToken]);

  // Keep-alive extension: touches server session and resets idle timestamp
  const handleStayLoggedIn = useCallback(async () => {
    setIsExtending(true);
    try {
      await fetch('/api/session/ping', {
        headers: {
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
      });
    } catch (err) {
      console.warn('Session ping failed, continuing local reset:', err);
    } finally {
      lastActivityRef.current = Date.now();
      setShowWarning(false);
      setIsExtending(false);
    }
  }, [csrfToken]);

  // Throttled activity listener (records at most once every 2 seconds)
  useEffect(() => {
    let throttleTimeout: number | null = null;

    const onUserActivity = () => {
      // If warning modal is open, don't silently dismiss via background mouse movements;
      // require explicit interaction with the dialog or page
      if (showWarning) return;

      if (!throttleTimeout) {
        lastActivityRef.current = Date.now();
        throttleTimeout = window.setTimeout(() => {
          throttleTimeout = null;
        }, 2000);
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, onUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, onUserActivity);
      });
      if (throttleTimeout) {
        window.clearTimeout(throttleTimeout);
      }
    };
  }, [showWarning]);

  // Timer interval: checks elapsed time every second
  useEffect(() => {
    const warningThresholdMs = timeoutMs - warningDurationMs; // 4 minutes

    const timer = setInterval(() => {
      if (isLoggingOutRef.current) return;

      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= timeoutMs) {
        // Timed out (5 minutes reached)
        clearInterval(timer);
        handleLogout();
      } else if (elapsed >= warningThresholdMs) {
        // Warning zone (4 minutes reached, 60s remaining)
        const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
        setSecondsRemaining(remaining);
        setShowWarning(true);
      } else if (showWarning) {
        setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeoutMs, warningDurationMs, handleLogout, showWarning]);

  if (!showWarning) {
    return null;
  }

  const percentRemaining = Math.max(0, Math.min(100, (secondsRemaining / (warningDurationMs / 1000)) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/30 bg-surface-card dark:bg-neutral-900 p-6 shadow-2xl transition-all">
        {/* Top Warning Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 shadow-inner">
            <Clock className="h-6 w-6 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Security Timeout
              </span>
            </div>
            <h3 id="session-timeout-title" className="mt-1 text-base font-bold text-content-primary">
              Session Inactivity Alert
            </h3>
            <p className="mt-1 text-xs text-content-secondary leading-relaxed">
              You have been idle for 4 minutes. For security and protection of crane operations data, your session will automatically terminate in:
            </p>
          </div>
        </div>

        {/* Live Countdown & Progress Indicator */}
        <div className="my-5 rounded-xl border border-border-default/70 bg-surface-app/70 p-4 text-center">
          <div className="flex items-baseline justify-center gap-1.5 font-mono">
            <span className={`text-4xl font-extrabold ${secondsRemaining <= 15 ? 'text-rose-500 animate-bounce' : 'text-amber-400'}`}>
              {secondsRemaining}
            </span>
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
              seconds remaining
            </span>
          </div>

          {/* Shrinking Countdown Progress Bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border-subtle">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                secondsRemaining <= 15
                  ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                  : 'bg-amber-500 shadow-sm shadow-amber-500/50'
              }`}
              style={{ width: `${percentRemaining}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-subtle/70">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border-default hover:bg-surface-app hover:text-content-primary text-content-secondary text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-500" />
            <span>Sign Out Now</span>
          </button>

          <button
            type="button"
            disabled={isExtending}
            onClick={handleStayLoggedIn}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isExtending ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Extending Session...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Stay Signed In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
