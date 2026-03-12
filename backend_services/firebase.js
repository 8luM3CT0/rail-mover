import firebase from 'firebase'
import 'firebase/firestore/dist/index.node.cjs'

const firebaseConfig = {
  apiKey: "AIzaSyA25fq5LOXnvAeKO1YOrsz2McZAQt0Zlk0",
  authDomain: "comp-redux.firebaseapp.com",
  projectId: "comp-redux",
  storageBucket: "comp-redux.appspot.com",
  messagingSenderId: "655010949662",
  appId: "1:655010949662:web:50abc8eb2719e26c689c0f",
  measurementId: "G-CEE55GZTL5"
};

const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app()

const creds = app.auth()
const store = app.firestore()
const provider = new firebase.auth.GoogleAuthProvider()
const storage = app.storage()

export {creds, provider, store, storage}