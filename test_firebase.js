const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

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
const db = getFirestore(app);

async function testFirebase() {
    console.log("Connecting to Firestore...");
    try {
        const querySnapshot = await getDocs(collection(db, "reviews"));
        console.log("Success! Documents found:", querySnapshot.size);
        querySnapshot.forEach((doc) => {
            console.log(doc.id, " => ", doc.data());
        });
    } catch (e) {
        console.error("Error connecting to Firestore:", e);
    }
    process.exit();
}

testFirebase();
