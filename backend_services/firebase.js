import firebase from 'firebase'
import 'firebase/firestore/dist/index.node.cjs'

const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "app.firebaseapp.com",
  projectId: "app-project",
  storageBucket: "app.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
  measurementId: "MEAUSRE_ID"
};

const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app()

const creds = app.auth()
const store = app.firestore()
const provider = new firebase.auth.GoogleAuthProvider()
const storage = app.storage()

export {creds, provider, store, storage}
