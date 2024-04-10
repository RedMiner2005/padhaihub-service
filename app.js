const express = require("express");
const app = express();
const port = process.env.PORT || 3001;

const admin = require('firebase-admin');
const { initializeApp, applicationDefault } = require('firebase-admin/app');

initializeApp({
    credential: applicationDefault(),
});

const db = admin.firestore();
const usersDb = db.collection('users');
const roomsDb = db.collection('rooms');

app.get("/", (req, res) => res.type('json').send("Pratyush's PadhaiHub Backend Service"));
app.get("/send/:toUserId/:roomId/", async (req, res) => {
    const toUserId = req.params["toUserId"];
    const roomId = req.params["roomId"];
    // const messageId = req.params["messageId"];

    const toUserDoc = await usersDb.doc(toUserId).get(); 
    if (!toUserDoc.exists || !("notification_token" in toUserDoc.data())) {
        console.log('No user ' + toUserId);
        res.send({"type": "error", "message": "InvalidToUserId"});
        return;
    } else {
        console.log(toUserDoc.data());
    }

    // const messageDoc = await roomsDb.doc(`${roomId}/messages/${messageId}`).get();
    const messageDoc = await roomsDb.doc(`${roomId}`).get();

    if (!messageDoc.exists) {
        // console.log('No message ' + messageId + ' or room ' + roomId);
        console.log('No room exists: ' + roomId);
        res.send({"type": "error", "message": "InvalidMessageOrRoom"});
        return;
    } else {
        console.log(messageDoc.data());
    }

    const fromUserId = messageDoc.data()["userIds"].filter(function(user) {
        return user != toUserId
    })[0];
    const fromUserDoc = await usersDb.doc(fromUserId).get(); 

    if (!fromUserDoc.exists) {
        console.log('No (from) user ' + fromUserId);
        res.send({"type": "error", "message": "InvalidFromUserId"});
        return;
    }

    const message = {
        notification: {
          title: 'New message',
          body: 'From: ' + fromUserDoc.data()["firstName"],
        },
        token: toUserDoc.data()["notification_token"]
      };
      admin.messaging().send(message)
        .then((resp) => {
          console.log('Message sent successfully:', resp);
          res.send({"type": "success", "message": "SentNotification"});
        }).catch((err) => {
          console.log('Failed to send the message:', err);
          res.send({"type": "error", "message": "SendError"});
        });
})

const server = app.listen(port, () => console.log(`PadhaiHub Service listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;


