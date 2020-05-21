//アニメーション
$(document).ready(function () {
    $('#event-details-container h1').textyle();
});



// FirebaseのConfig
const firebaseConfig = {
    apiKey: "AIzaSyCcWfxYb5RdCd05M4nJIYawfmel_JJruHk",
    authDomain: "mokumoku-e04f4.firebaseapp.com",
    databaseURL: "https://mokumoku-e04f4.firebaseio.com",
    projectId: "mokumoku-e04f4",
    storageBucket: "mokumoku-e04f4.appspot.com",
    messagingSenderId: "833152582287",
    appId: "1:833152582287:web:c794daa444dc64e75166fa"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

const rsvpListener = null;
const guestbookListener = null;


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


// // 日時をいい感じの形式にする関数
// function convertFromFirestoreTimestampToDatetime(timestamp) {
//     const _d = timestamp ? new Date(timestamp * 1000) : new Date();
//     const Y = _d.getFullYear();
//     const m = (_d.getMonth() + 1).toString().padStart(2, '0');
//     const d = _d.getDate().toString().padStart(2, '0');
//     const H = _d.getHours().toString().padStart(2, '0');
//     const i = _d.getMinutes().toString().padStart(2, '0');
//     const s = _d.getSeconds().toString().padStart(2, '0');
//     return `${Y}/${m}/${d} ${H}:${i}:${s}`;
// }

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
        subscribeGuestbook(user);
        //attendeesコレクションをsubscribe
        subscribeCurrentRSVP(user);
    } else {
        startRsvpButton.textContent = "参加する？"
        //ログインしてないuserにはguestbookを隠す
        guestbookContainer.style.display = "none";

        //guesbookのコレクションをunsubscribe
        unsubscribeGuestbook(user);
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
                //それぞれのドキュメントに対しHTML要素をつくって、チャットに追加
                const entry = document.createElement("p");
                entry.textContent =
                    doc.data().name
                    + " : "
                    + doc.data().text
                    + " ("
                    + doc.data().timestamp
                    + ") ";
                guestbook.appendChild(entry);
            });
        });
};

// guestbookの更新Listenしない
function unsubscribeGuestbook() {
    if (guestbookListener != null) {
        guestbookListener();
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

        numberAttending.innerHTML = '参加予定 : ' + newAttendeeCount + '人';
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
                    console.log(rsvpYes.className);
                }
                else {
                    rsvpYes.className = "";
                    rsvpNo.className = "clicked";
                }
            }
        });
}

function unsubscribeCurrentRSVP() {
    if (rsvpListener != null) {
        rsvpListener();
        rsvpListener = null;
    }
    rsvpYes.className = "";
    rsvpNo.className = "";
}
