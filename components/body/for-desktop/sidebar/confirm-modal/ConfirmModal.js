//front-end
import React, { useState } from 'react'
//back-end
import { useRouter } from 'next/router'
import { creds, store } from '../../../../../backend_services/firebase'
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocument } from 'react-firebase-hooks/firestore';

function ConfirmModal() {
    const [user] = useAuthState(creds)
    const router = useRouter()
    const [paymentOptionsMode, setPaymentOptionsMode] = useState(true)
    const [stripePaymentMode, setStripePaymentMode] = useState(false)
    const [gcashPaymentMode, setGcashPaymentMode] = useState(false)
    const [mayaPaymentMode, setMayaPaymentMode] = useState(false)
    const [amount, setAmount] = useState(0)
    const [loading, setLoading] = useState(false)

    async function checkout() {
      try{
        if(!user) throw new Error("User not authenticated")
        if(!amount || Number(amount) <= 0) throw new Error("invalid amount!")

        setLoading(true)
        const res = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            amount: Number(amount),
            uid: user.uid,
            email: user.email
          }),
        });
        const json = await res.json();
        if(!res.ok) throw new Error(json?.error || "failed")
          window.location.href = json.url
      }catch(e){
        console.error("Error during checkout >>>", e)
        alert("Checkout failed!")
      } finally{
        setLoading(false)
      }
  }

  // ADD: basic sanitizer
  const amountNum = Number(String(amount).replace(/[^\d.]/g, ""));
  const validAmount = Number.isFinite(amountNum) && amountNum > 0;

  async function handleGCashTopup() {
  try {
    const res = await fetch("/api/stripe/create-alt-topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "gcash",
        uid: user.uid,
        email: user.email,
        amount: Number(amountNum),
      }),
    });

    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }

    if (!res.ok) {
      console.error("GCash top-up error >>>", { status: res.status, json });
      return;
    }

    if (!json?.url) {
      console.error("Missing redirect URL >>>", json);
      return;
    }

    window.location.href = json.url;
  } catch (e) {
    console.error("GCash top-up exception >>>", e);
  }
}


  async function handleMayaTopup(){
        if (!user) {
      alert("Sign in first to top-up.");
      return;
    }

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/stripe/create-alt-topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          amount: value,
          method: "maya"
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.url) {
        console.error("Maya top-up error >>>", json);
        alert("Failed to create Maya payment.");
        return;
      }

      // Redirect user to GCash payment page (hosted by Checkout.com)
      window.location.href = json.url;
    } catch (e) {
      console.error("Maya top-up exception >>>", e);
      alert("Unexpected error during Maya top-up.");
    } finally {
      setLoading(false);
    }
  }

  const [walletBalance] = useDocument(
    store.collection('eazemo_wallets').doc(user?.email)
  )

  const balanceMinor = walletBalance?.data()?.balanceMinor ?? 0
  const balance = balanceMinor / 100

  return (
    <div className="h-full w-full mx-auto rounded-lg m-auto bg-slate-200">
      <header className="h-[9%] w-full bg-slate-800 border border-amber-500 rounded-t-lg flex items-center px-3 py-2">
        <h3 className="font-stack-head font-semibold text-lg text-amber-400">
          EazeMo - Topup
        </h3>
      </header>
      {paymentOptionsMode && (
        <div className="h-[91%] w-full flex flex-col items-start bg-slate-800 bg-opacity-[0.33]">
        <div className="h-[25%] w-full bg-slate-800 bg-opacity-[0.78] flex flex-col items-center justify-evenly">
          <span className="flex items-center justify-between w-full px-3 py-1">
            <p className="font-stack-head font-semibold text-amber-400 text-base">
              Current balance:
            </p>
            <span></span>
          </span>
          <span className="w-full flex items-center space-x-3 px-3">
            <p className="font-stack-head font-semibold text-amber-400 text-base">
              EZ-Wallet
            </p>
            <h3 className="font-stack-head font-normal text-2xl text-amber-500">
              {balance}
            </h3>
          </span>
        </div>
        <div className="h-[75%] w-full bg-slate-800 bg-opacity-[0.78]">
          <div className="h-[10%] w-full bg-slate-800 rounded border border-amber-500 flex items-center px-3">
          {paymentOptionsMode && (
            <h3 className="font-semibold font-stack-head text-lg text-amber-500">
            Top-up via the methods below
          </h3>
          )}
          {stripePaymentMode && (
          <h3 className="font-semibold font-stack-head text-lg text-[#635bfff]">
            Top-up via the methods below
          </h3>
          )}
          {gcashPaymentMode && (
            <h3 className="font-semibold font-stack-head text-lg text-sky-500">
            Top-up via the methods below
          </h3>
          )}
          {mayaPaymentMode && (
            <h3 className="font-semibold font-stack-head text-lg text-emerald-500">
            Top-up via the methods below
          </h3>
          )}
          </div>
          <div className="h-[90%] w-full flex flex-col items-center justify-evenly">
            <button 
            onClick={() => {
              setStripePaymentMode(true)
              setPaymentOptionsMode(false)
              setGcashPaymentMode(false)
              setMayaPaymentMode(false)
            }}
            className="focus:outline-none h-[32%] w-full bg-[#635bff] bg-opacity-[0.78] border-slate-800 border flex items-center justify-center px-3 py-2 hover:bg-slate-900 hover:border-[#635bff] transform transition-all duration-300 ease-in-out group">
              <h3 className="font-stack-head font-semibold text-4xl text-slate-800 group-hover:text-[#635bff] transform transition-all duration-300 ease-in-out">
                Credit/debit
              </h3>
            </button>
            <button 
            onClick={() => {
              setGcashPaymentMode(true)
              setPaymentOptionsMode(false)
              setStripePaymentMode(false)
              setMayaPaymentMode(false)
            }}
            className="focus:outline-none h-[32%] w-full bg-sky-500 bg-opacity-[0.78] border-slate-800 border flex items-center justify-center px-3 py-2 hover:bg-slate-900 hover:border-sky-500 transform transition-all duration-300 ease-in-out group">
              <h3 className="font-stack-head font-semibold text-4xl text-slate-800 group-hover:text-sky-500 transform transition-all duration-300 ease-in-out">
                GCash
              </h3>
            </button>
            <button 
            onClick={() => {
              setGcashPaymentMode(false)
              setPaymentOptionsMode(false)
              setStripePaymentMode(false)
              setMayaPaymentMode(true)
            }}
            className="focus:outline-none h-[32%] w-full bg-emerald-500 bg-opacity-[0.78] border-slate-800 border flex items-center justify-center px-3 py-2 hover:bg-slate-900 hover:border-emerald-500 transform transition-all duration-300 ease-in-out group">
              <h3 className="font-stack-head font-semibold text-4xl text-slate-800 group-hover:text-emerald-500 transform transition-all duration-300 ease-in-out">
                Maya
              </h3>
            </button>
            </div>
        </div>
      </div>
      )}   
      {stripePaymentMode && (
        <div className="h-[91%] w-full bg-slate-800 border-2 border-[#635bff] rounded flex flex-col items-start">
          <span className="h-[8%] w-full flex items-center border-b-2 border-[#635bff]">
            <button 
            onClick={(() => {
              setStripePaymentMode(false)
              setPaymentOptionsMode(true)
            })}
            className="focus:outline-none h-[88%] w-[16%] border-2 border-[#635bff] hover:bg-[#726ce8] hover:border-[#726ce8] hover:text-slate-800 text-[#635bff] font-stack-head font-semibold rounded px-2 py-1 transform transition-all duration-300 ease-in-out">
              Back
            </button>
            <span className="h-full w-[84%]"></span>
          </span>
          <div className="h-[92%] px-6 w-full py-4 space-y-8">
          <h3 className="font-stack-head text-lg text-[#635bff] font-bold">
            Load via credit/debit
          </h3>
        <div className="flex flex-col space-y-1 w-full">
           <p className="text-base font-stack-head font-semibold text-[#635bff]">
            Load amount
          </p>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="px-3 py-2 rounded w-full mx-auto font-stack-head font-semibold outline-none text-[#635bff] bg-slate-800 border overflow-hidden border-[#635bff]"
          />
        </div>
        <span className="w-full flex items-center justify-between">
          <span></span>
                  <button
          onClick={checkout}
          disabled={loading || !user}
          className="focus:outline-none mt-2 px-4 py-2 rounded bg-[#635bff] text-slate-800 font-semibold hover:bg-slate-800 hover:border hover:border-[#635bff] hover:text-[#635bff] transform transition-all duration-300 ease-in-out disabled:opacity-50"
        >
          {loading ? "Processing…" : "Proceed to payment"}
        </button>

        </span>
      </div>
        </div>
      )}
      {gcashPaymentMode && (
        <div className="h-[91%] w-full bg-slate-800 border-2 border-sky-500">
          <span className="h-[8%] w-full flex items-center border-b-2 border-sky-500">
            <button 
            onClick={(() => {
              setGcashPaymentMode(false)
              setPaymentOptionsMode(true)
            })}
            className="focus:outline-none h-[88%] w-[16%] border-2 border-sky-500 hover:bg-sky-700 hover:border-sky-700 hover:text-slate-800 text-sky-500 font-stack-head font-semibold rounded px-2 py-1 transform transition-all duration-300 ease-in-out">
              Back
            </button>
            <span className="h-full w-[84%]"></span>
          </span>
        </div>
      )}
      {mayaPaymentMode && (
        <div className="h-[91%] w-full bg-slate-800 border-2 border-emerald-500">
          <span className="h-[8%] w-full flex items-center border-b-2 border-emerald-500">
            <button 
            onClick={(() => {
              setMayaPaymentMode(false)
              setPaymentOptionsMode(true)
            })}
            className="focus:outline-none h-[88%] w-[16%] border-2 border-emerald-500 hover:bg-emerald-700 hover:border-emerald-700 hover:text-slate-800 text-emerald-500 font-stack-head font-semibold rounded px-2 py-1 transform transition-all duration-300 ease-in-out">
              Back
            </button>
            <span className="h-full w-[84%]"></span>
          </span>
        </div>
      )}
    </div>
  )
}

export default ConfirmModal

{/**
   <div className="h-full w-full mx-auto rounded-lg m-auto bg-slate-200">
      <header className="w-full h-[50px] px-6 py-3 bg-slate-900 rounded-t-lg text-slate-200 font-stack-head font-bold">EazeMo — Topup</header>
      <div className="h-[50px] w-full flex items-center space-x-3 px-3 py-1 border-b-2 border-slate-800">
        <button 
        disabled={stripePaymentMode}
        onClick={() => {
          setStripePaymentMode(true)
          setGcashPaymentMode(false)
          setMayaPaymentMode(false)
        }}
        className={`h-full min-w-[60px] px-2 rounded bg-slate-800 text-slate-200 font-stack-head font-semibold hover:bg-slate-700 hover:text-slate-100 transform transition-all duration-300 ease-in-out ${stripePaymentMode && 'bg-slate-500 text-slate-100'}`}>
        Credit/debit
        </button>
        <button 
        disabled={gcashPaymentMode}
        onClick={() => {
          setStripePaymentMode(false)
          setGcashPaymentMode(true)
          setMayaPaymentMode(false)
        }}
        className={`h-full min-w-[60px] px-2 rounded bg-sky-800 text-slate-200 font-stack-head font-semibold hover:bg-sky-700 hover:text-slate-100 transform transition-all duration-300 ease-in-out ${gcashPaymentMode && 'bg-sky-500 text-slate-100'}`}>
        GCash
        </button>
        <button 
        disabled={mayaPaymentMode}
        onClick={() => {
          setStripePaymentMode(false)
          setGcashPaymentMode(false)
          setMayaPaymentMode(true)
        }}
        className={`h-full min-w-[60px] px-2 rounded bg-emerald-700 text-slate-200 font-stack-head font-semibold hover:bg-emerald-400 hover:text-slate-100 transform transition-all duration-300 ease-in-out ${mayaPaymentMode && 'bg-emerald-500 text-slate-100'}`}>
        Maya
        </button>
      </div>
      {stripePaymentMode && (
        <div className="px-6 py-4 space-y-4">
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-semibold text-slate-800">
            Load amount
          </label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="px-3 py-2 rounded border border-slate-400 outline-none text-slate-800 bg-white"
          />
        </div>

        <button
          onClick={checkout}
          disabled={loading || !user}
          className="mt-2 px-4 py-2 rounded bg-slate-900 text-slate-100 font-semibold disabled:opacity-50"
        >
          {loading ? "Processing…" : "Proceed to payment"}
        </button>
      </div>
      )}   
      {gcashPaymentMode && (
         <div className="w-full max-w-sm border border-slate-300 rounded-lg p-4 space-y-3">
      <div className="text-sm font-semibold text-slate-800">
        Top-up via GCash
      </div>

      <div className="space-y-1">
        <label className="block text-xs text-slate-600">
          Amount (PHP)
        </label>
        <input
          type="number"
          inputMode='decimal'
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-2 py-1 border border-slate-400 rounded text-sm text-slate-800"
        />
      </div>

      <button
        onClick={handleGCashTopup}
        disabled={loading || !user}
        className="w-full px-3 py-2 rounded bg-sky-600 text-white text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "Redirecting to GCash…" : "Top-up with GCash"}
      </button></div>
      )}
      {mayaPaymentMode && (
        <div className="w-full max-w-sm border border-slate-300 rounded-lg p-4 space-y-3">
      <div className="text-sm font-semibold text-slate-800">
        Top-up via Maya
      </div>

      <div className="space-y-1">
        <label className="block text-xs text-slate-600">
          Amount (PHP)
        </label>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-2 py-1 border border-slate-400 rounded text-sm text-slate-800"
        />
      </div>

      <button
        onClick={handleMayaTopup}
        disabled={loading || !user}
        className="w-full px-3 py-2 rounded bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "Redirecting to Maya..." : "Top-up with Maya"}
      </button></div>
      )}   
    </div>
  )
  */}