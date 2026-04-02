const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = require("./config.js");

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
