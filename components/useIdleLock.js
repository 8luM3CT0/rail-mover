import { useEffect, useRef, useState } from "react";

export default function useIdleLock(timeoutMs = 20000, enabled = true) {
  const [locked, setLocked] = useState(false);
  const tRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if(!enabled){
      if(tRef.current) clearTimeout(tRef.current)
        tRef.current = null
      setLocked(false)
      return;
    }

    const reset = () => {
      if (locked) return; // don't auto-unlock by activity
      if (tRef.current) clearTimeout(tRef.current);
      tRef.current = setTimeout(() => setLocked(true), timeoutMs);  

    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));

    reset();

    return () => {
      if (tRef.current) clearTimeout(tRef.current);
      tRef.current = null;
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [timeoutMs, locked, enabled]);

  const unlockLocal = () => setLocked(false);
  const lockNow = () => setLocked(true);

  return { locked, unlockLocal, lockNow };
}
