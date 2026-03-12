//front-end
import React from 'react'
//back-end
import { useEffect, useMemo, useState } from 'react'

function PinLockModal({open, email, onUnlocked, onCloseBlocked}) {
    const [pin, setPin] = useState('')
    const [pin2, setPin2] = useState('')
    const [mode, setMode] = useState('verify')
    const [busy, setBusy] = useState(false)
    const [err, setErr] = useState('')

    const canSubmitSet = useMemo(() => /^\d{4}$/.test(pin) && pin === pin2, [pin, pin2]);
    const canSubmitVerify = useMemo(() => /^\d{4}$/.test(pin), [pin])
  
    useEffect(() => {
        if(!open) return
        setPin('')
        setPin2('')
        setErr('')
        setMode('verify')
    }, [open])

    async function submit(){
      /*const safeEmail = typeof email === "string" ? email.trim() : "";

      if(!safeEmail){
        setErr("missing user email. Sign in again")
        return;
      }
        */

        if(!email) return

        setBusy(true)
        setErr('')

        try{
            if(mode === "set"){
                if(!canSubmitSet){
                    setErr('PIN must be 4 digits and match.')
                    return;
                }
                const res = await fetch("/api/pin/set", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({email, pin})
                })

                const json = await res?.json().catch(() => ({}));

                if(!res.ok || !json.ok){
                    setErr(json.error || "Failed to set PIN")
                    return
                }
                onUnlocked && onUnlocked()
                return
            }
            if(!canSubmitVerify){
                setErr("Enter a 4-digit PIN")
                return
            }
            const res = await fetch("/api/pin/verify", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email, pin})
            })
            const json = await res.json().catch(() => ({}))

            if (!res.ok || !json.ok) {
        if (json.error === "pin_not_set") {
          setMode("set");
          setPin("");
          setPin2("");
          setErr("Set your 4-digit PIN.");
          return;
        }
        if (json.error === "locked") {
          setErr("Too many attempts. Try again later.");
          setPin("")
          return;
        }
        setErr(json.error === "wrong_pin" ? "Wrong PIN." : (json.error || "Verification failed."));
        setPin("");
        return;
      }

      onUnlocked && onUnlocked()
        } catch(e){
          console.error("PinLockModal submit error >>>", e)
        } finally {
            setBusy(false)
        }
    }

    if(!open) return null

    return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative w-full max-w-[420px] rounded-lg border border-amber-400 bg-slate-900 p-4 text-slate-100">
        <div className="flex items-center justify-between border-b border-amber-400 pb-2">
          <div className="text-sm font-stack-head font-bold">
            {mode === "set" ? "Set PIN" : "Enter PIN"}
          </div>

          {!onCloseBlocked && (
            <button
              disabled={busy}
              onClick={() => onUnlocked?.()}
              className="text-xs px-2 py-1 rounded border border-red-400 text-red-300"
            >
              X
            </button>
          )}
        </div>

        <div className="pt-3 space-y-3">
          <div className="text-xs text-slate-300 font-stack-head">
            {mode === "set"
              ? "Create a 4-digit PIN. It will be required after inactivity."
              : "Session locked due to inactivity. Enter your 4-digit PIN to continue."}
          </div>

          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder="••••"
            className="w-full rounded border border-slate-400 bg-slate-800 px-3 py-2 text-center text-lg tracking-[0.6em] font-mono outline-none"
          />

          {mode === "set" && (
            <input
              value={pin2}
              onChange={(e) => setPin2(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
              inputMode="numeric"
              placeholder="Confirm ••••"
              className="w-full rounded border border-slate-400 bg-slate-800 px-3 py-2 text-center text-lg tracking-[0.6em] font-mono outline-none"
            />
          )}

          {err && <div className="text-xs text-red-300">{err}</div>}

          <button
            disabled={busy || (mode === "set" ? !canSubmitSet : !canSubmitVerify)}
            onClick={submit}
            className="w-full rounded bg-amber-600 px-3 py-2 text-sm font-stack-head font-bold text-slate-900 disabled:opacity-50"
          >
            {busy ? "Processing…" : mode === "set" ? "Set PIN" : "Unlock"}
          </button>

          <div className="text-[10px] text-slate-400 font-stack-head">
            PIN is stored as a hash, not as plain digits.
          </div>
        </div>
      </div>
    </div>
  )
}

export default PinLockModal
