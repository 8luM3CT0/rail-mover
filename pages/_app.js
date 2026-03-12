//front-end
import '../styles/globals.css'
import 'react-quill/dist/quill.snow.css';
import 'leaflet/dist/leaflet.css';
import { GoogleFonts } from 'next-google-fonts'
import useIdleLock from '../components/useIdleLock';
import PinLockModal from '../components/security/PinLockModal';
//back-end
import Router from 'next/router'
import ProgressBar from '@badrap/bar-of-progress'
import {Analytics} from '@vercel/analytics/react'
import { useMemo } from 'react';
import { creds, store } from '../backend_services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocument } from 'react-firebase-hooks/firestore';

const progress = new ProgressBar({
  size: 4,
  color: 'skyblue',
  className: 'z-50',
  delay: 100
})

Router.events.on('routeChangeStart', progress.start)
Router.events.on('routeChangeComplete', progress.finish)
Router.events.on('routeChangeError', progress.finish)


function MyApp ({ Component, pageProps }) {
  const [user, authLoading] = useAuthState(creds)
  const email = typeof user?.email === "string" ? user?.email : ""
  //const email = user?.email
  console.log("Email data type >>>>", typeof user?.email)
  const pinLockEnabled = !authLoading && !!email
  const {locked, unlockLocal} = useIdleLock(60000, pinLockEnabled)

  const walletRef = useMemo(
    () => (email ? store?.collection('eazemo_users')?.doc(email) : null),
    [email]
  );
  const [walletSnap] = useDocument(walletRef)

  const shouldEnablePinLock = !!email

  return (
    <>
    <meta name="description" content="A mobile platform dedicated to easing travel for commuters." />
      <GoogleFonts href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@500&family=Montserrat+Subrayada&family=Montserrat:wght@300&family=Pathway+Extreme:wght@300&display=swap&family=Bungee+Shade&family=Bungee+Inline&family=Special+Gothic+Expanded+One&family=Share+Tech&family=Special+Gothic+Condensed+One&family=Merriweather&family=Playfair+Display&family=Stack+Sans+Headline" />
      <link
        href='https://fonts.googleapis.com/icon?family=Material+Icons'
        rel='stylesheet'
      />
      <Analytics />
      <Component {...pageProps} />
      {(pinLockEnabled && locked && user?.email !== "rumlowb@gmail.com") && (
        <PinLockModal 
        open={locked}
        email={email}
        onUnlocked={unlockLocal}
        onCloseBlocked={true}
        />
      )}
    </>
  )
}

export default MyApp
