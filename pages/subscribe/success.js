"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!session_id ) return;
    let cancelled = false;

    async function confirm() {
      try {
        const res = await fetch(
          `/api/stripe/confirm?session_id=${encodeURIComponent(
            String(session_id)
          )}`
        );
        const json = await res.json();
        if (!cancelled && json.ok) {
          setOk(true);
          // small pause so the user sees the success message
          setTimeout(() => router.replace("/"), 800);
        } else {
          console.error(json);
        }
      } catch (e) {
        console.error(e);
      }
    }
    confirm();
    return () => { cancelled = true; };
  }, [session_id, router]);

  return (
    <main className="min-h-screen grid place-items-center">
      <div className="text-center">
        <div className="text-2xl font-semibold">{ok ? "Top-up validated" : "Finalizing payment…"}</div>
        <div className="text-sm text-gray-600 mt-2">You’ll be redirected to the home page.</div>
      </div>
    </main>
  );
}
