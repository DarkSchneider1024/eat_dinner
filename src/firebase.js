import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBGheuvbR1NKe6PA0pLrdeJB0kyr5mNSxQ",
    authDomain: "eatdinner-bb986.firebaseapp.com",
    projectId: "eatdinner-bb986",
    storageBucket: "eatdinner-bb986.firebasestorage.app",
    messagingSenderId: "503284615803",
    appId: "1:503284615803:web:455a12f1c5d2438fa5f0de",
    measurementId: "G-LFQZ1NFR9H"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
