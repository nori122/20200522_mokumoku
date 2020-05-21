// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

var rsvpListener = null;
var guestbookListener = null;

// Add Firebase project configuration object here
var firebaseConfig = {
    apiKey: "AIzaSyDGVD21B9d4dzE2ATY576DFg-KuFpuC6Ks",
    authDomain: "fir-web-codelab-7942d.firebaseapp.com",
    databaseURL: "https://fir-web-codelab-7942d.firebaseio.com",
    projectId: "fir-web-codelab-7942d",
    storageBucket: "fir-web-codelab-7942d.appspot.com",
    messagingSenderId: "440389058774",
    appId: "1:440389058774:web:d97737f6bba284daa44977"
};

// firebase.initializeApp(firebaseConfig);
firebase.initializeApp(firebaseConfig);

// FirebaseUI config
const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
        // Email / Password Provider.
        firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            // Handle sign-in.
            // Return false to avoid redirect.
            return false;
        }
    }
};

const ui = new firebaseui.auth.AuthUI(firebase.auth());

//RSVPボタンをlisten
startRsvpButton.addEventListener("click",
    () => {
        if (firebase.auth().currentUser) {
            //userがサインインしてたら; userにサインアウトさせる
            firebase.auth().signOut();
        } else {
            //誰もuserがサインインしていなければ； userにサインインさせる
            ui.start("#firebaseui-auth-container", uiConfig);
        }
    });

// 現在の認証状況をlisten
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        startRsvpButton.textContent = "ログアウト";
        //ログイン済userにはguestbookを見せる
        guestbookContainer.style.display = "block";

        //guestbookのコレクションをSubscribe
        subscribeGuestbook();
        //attendeesコレクションをsubscribe
        subscribeCurrentRSVP(user);
    } else {
        startRsvpButton.textContent = "参加する？"
        //ログインしてないuserにはguestbookを隠す
        guestbookContainer.style.display = "none";

        //guesbookのコレクションをunsubscribe
        unsubscribeGuestbook();
        //attendeesコレクションをunsubscribe
        unsubscribeCurrentRSVP(user);
    }
});

//送信フォームをlisten
form.addEventListener("submit", (e) => {
    //デフォルトフォームのリダイレクトを防ぐ
    e.preventDefault();
    //新しいメッセージを"guestbook"コレクションに追加
    firebase.firestore().collection("guestbook").add({
        text: input.value,
        timestamp: Date.now(),
        name: firebase.auth().currentUser.displayName,
        userId: firebase.auth().currentUser.uid
    })
    //メッセージフィールドをからに
    input.value = "";
    //リダイレクトを防ぐためにfalseを返す
    return false;
})

//guestbookの更新をlisten
function subscribeGuestbook() {
    //メッセージに対するqueryを作成
    guestbookListener = firebase.firestore().collection("guestbook")
        .orderBy('timestamp', 'desc')
        .onSnapshot((snaps) => {
            //ページをリセット
            guestbook.innerHTML = "";
            //databaseのdocumentsをループする
            snaps.forEach((doc) => {
                //それぞれのドキュメントに対しHTML要素をつ食って、チャットに追加
                const entry = document.createElement("p");
                entry.textContent = doc.data().name + " : " + doc.data().text;
                guestbook.appendChild(entry);
            });
        });
};

// guestbookの更新Listenしない
function unsubscribeGuestbook() {
    if (guestbookListener != null) {
        guestbookListner();
        guestbookListner = null;
    }
}

//RSVPの回答をListen
rsvpYes.onclick = () => {
    //attendeesコレクションから、userのドキュメントを取得
    const userDoc = firebase.firestore().collection('attendees').doc(firebase.auth().currentUser.uid);

    //If RSVPがYesなら、attendingフィールドにtrueとかく
    userDoc.set({
        attending: true
    }).catch(console.error)
}

rsvpNo.onclick = () => {
    //attendeesコレクションから、userのドキュメントを取得
    const userDoc = firebase.firestore().collection('attendees').doc(firebase.auth().currentUser.uid);

    //If RSVPがNoなら、attendingフィールドにfalseとかく
    userDoc.set({
        attending: false
    }).catch(console.error)
}

//attendee list をlisten
firebase.firestore()
    .collection('attendees')
    .where("attending", "==", true)
    .onSnapshot(snap => {
        const newAttendeeCount = snap.docs.length;

        numberAttending.innerHTML = newAttendeeCount + '人が参加';
    })

function subscribeCurrentRSVP(user) {
    rsvpListener = firebase.firestore()
        .collection('attendees')
        .doc(user.uid)
        .onSnapshot((doc) => {
            if (doc && doc.data()) {
                const attendingResponse = doc.data().attending;

                //cssのクラスを更新
                if (attendingResponse) {
                    rsvpYes.className = "clicked";
                    rsvpNo.className = "";
                }
                else {
                    rsvpYes.className = "";
                    rsvpNo.className = "clicked";
                }
            }
        });
}

function unsubscribeCurrentRSVP() {
    if (rsvpListner != null) {
        rsvpListner();
        rsvpListner = null;
    }
    rsvpYes.className = "";
    rsvpNo.className = "";
}