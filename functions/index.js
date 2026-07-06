const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const nodemailer = require("nodemailer");

admin.initializeApp();

// ==========================================
// 1. Agora Token Server
// ==========================================
exports.generateAgoraToken = onRequest({ cors: true }, (req, res) => {
  // Ensure we have the App ID and Certificate in environment variables
  // In production, use firebase functions:secrets:set AGORA_APP_CERTIFICATE
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appID || !appCertificate) {
    res.status(500).json({ error: "Agora credentials missing in server." });
    return;
  }

  const channelName = req.query.channelName;
  if (!channelName) {
    res.status(400).json({ error: "channelName is required" });
    return;
  }

  // Use uid passed or default to 0 (which lets Agora assign a uid)
  let uid = req.query.uid;
  if (!uid || uid === "") {
    uid = 0;
  } else {
    // In Agora RTC, uid can be integer or string (account)
    // We treat it as integer if possible
    uid = isNaN(uid) ? uid : parseInt(uid, 10);
  }

  // Role: Publisher can send and receive streams
  const role = RtcRole.PUBLISHER;
  
  // Set token expiration (e.g., 2 hours)
  const expirationTimeInSeconds = 7200;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    let token;
    if (typeof uid === "string") {
      token = RtcTokenBuilder.buildTokenWithAccount(
        appID,
        appCertificate,
        channelName,
        uid,
        role,
        privilegeExpiredTs
      );
    } else {
      token = RtcTokenBuilder.buildTokenWithUid(
        appID,
        appCertificate,
        channelName,
        uid,
        role,
        privilegeExpiredTs
      );
    }
    res.json({ token, channelName, uid });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// ==========================================
// 2. Email Notifications (Optional/Example)
// ==========================================
// This function triggers when a new meeting is created in Firestore
// and sends an email via SMTP.

// To use this, you need SMTP credentials (e.g., SendGrid, Gmail)
// set in Firebase environment variables:
// firebase functions:secrets:set SMTP_EMAIL
// firebase functions:secrets:set SMTP_PASSWORD

const transporter = nodemailer.createTransport({
  service: "gmail", // Swap with "sendgrid" or another provider
  auth: {
    user: process.env.SMTP_EMAIL || "test@example.com",
    pass: process.env.SMTP_PASSWORD || "password",
  },
});

exports.onMeetingCreated = onDocumentCreated("meetings/{meetingId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const meetingData = snapshot.data();
  const classId = meetingData.classId;

  if (!classId) {
    console.log("No classId for this meeting. Skipping email.");
    return;
  }

  try {
    // 1. Fetch class details to get enrolled students
    const classDoc = await admin.firestore().collection("classes").doc(classId).get();
    if (!classDoc.exists) return;
    
    const classData = classDoc.data();
    const studentIds = classData.roster || [];
    if (studentIds.length === 0) return;

    // 2. Fetch student emails
    const studentsPromises = studentIds.map((id) => 
      admin.firestore().collection("users").doc(id).get()
    );
    const studentsDocs = await Promise.all(studentsPromises);
    
    const emails = studentsDocs
      .filter((doc) => doc.exists)
      .map((doc) => doc.data().email)
      .filter((email) => !!email);

    if (emails.length === 0) return;

    // 3. Send Emails
    const mailOptions = {
      from: process.env.SMTP_EMAIL || "noreply@videopro.com",
      to: emails.join(", "),
      subject: `New Meeting: ${meetingData.title || "Live Session"}`,
      text: `A new meeting has been scheduled/started for class: ${classData.title}.\nJoin here: https://yourdomain.com/student/class/${classId}?join=true`,
    };

    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
       await transporter.sendMail(mailOptions);
       console.log("Emails sent to:", emails);
    } else {
       console.log("SMTP credentials missing, skipped sending real emails to", emails);
    }

  } catch (error) {
    console.error("Error in onMeetingCreated trigger:", error);
  }
});
