const firebaseConfig = {
    apiKey: "AIzaSyBGheuvbR1NKe6PA0pLrdeJB0kyr5mNSxQ",
    authDomain: "eatdinner-bb986.firebaseapp.com",
    projectId: "eatdinner-bb986",
    storageBucket: "eatdinner-bb986.firebasestorage.app",
    messagingSenderId: "503284615803",
    appId: "1:503284615803:web:455a12f1c5d2438fa5f0de",
    measurementId: "G-LFQZ1NFR9H"
};

// 讓 Node.js (test_firebase.js) 也能 require 取用，而在瀏覽器端則掛在全域變數上
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}
