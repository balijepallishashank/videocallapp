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

// ==========================================
// 3. Secure End Live Meeting (HTTP endpoint)
// Expects Authorization: Bearer <Firebase ID Token>
// Body: { channelName: string }
// Only users who have a Firestore `users/{uid}` doc with role === 'faculty' will be allowed.
// This performs the same operations as the client-side `endLiveMeeting` but using admin privileges.
// ==========================================
exports.endLiveMeeting = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).send({ error: 'Method Not Allowed' })

    const authHeader = req.headers.authorization || ''
    const match = authHeader.match(/^Bearer (.+)$/)
    if (!match) return res.status(401).send({ error: 'Missing Authorization header' })

    const idToken = match[1]
    const decoded = await admin.auth().verifyIdToken(idToken)
    const uid = decoded.uid

    // Check user role in Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get()
    if (!userDoc.exists) return res.status(403).send({ error: 'User profile not found' })
    const profile = userDoc.data() || {}
    if (profile.role !== 'faculty') return res.status(403).send({ error: 'Insufficient role' })

    const { channelName } = req.body || {}
    if (!channelName) return res.status(400).send({ error: 'channelName is required' })

    const docRef = admin.firestore().collection('live_meetings').doc(channelName)
    const snap = await docRef.get()

    if (snap.exists) {
      const data = snap.data() || {}
      const meetingSessionId = data.meetingSessionId || `meeting-${channelName}`
      const startedAt = new Date(data.startedAt)
      const durationSec = Math.round((Date.now() - startedAt.getTime()) / 1000)
      const facultyId = data.facultyId || ''
      const classId = data.classId || channelName

      // Fetch attendance for this meeting session
      const attQuery = admin.firestore().collection('meeting_attendance').where('meetingId', '==', meetingSessionId)
      const attSnap = await attQuery.get()

      const batch = admin.firestore().batch()
      const endTimeStr = new Date().toISOString()

      attSnap.forEach((doc) => {
        const att = doc.data() || {}
        if (att.joinTime && !att.leaveTime) {
          const studentJoinTime = new Date(att.joinTime)
          const sessionSec = Math.max(0, Math.round((Date.now() - studentJoinTime.getTime()) / 1000))
          batch.update(doc.ref, {
            leaveTime: endTimeStr,
            duration: (att.duration || 0) + sessionSec,
            updatedAt: endTimeStr,
          })
        }
      })

      // Create meeting record
      const participantsList = attSnap.docs.filter(d => d.data().joinTime).map(d => d.data().studentName || 'Student')
      const attendanceReport = attSnap.docs.map(d => ({ name: d.data().studentName || 'Student', status: d.data().joinTime ? 'Attended' : 'Absent' }))

      const meetingRecordRef = admin.firestore().collection('meetings').doc(meetingSessionId)
      batch.set(meetingRecordRef, {
        id: meetingSessionId,
        classId,
        meetingId: meetingSessionId,
        title: data.title || 'Live Session',
        date: data.startedAt,
        duration: durationSec,
        participants: participantsList,
        attendanceReport,
        recordingUrl: '',
        recording: '',
        createdAt: endTimeStr,
        facultyId,
      })

      // Delete live meeting doc
      batch.delete(docRef)

      await batch.commit()
      return res.status(200).send({ success: true })
    } else {
      // If not exists, ensure deletion
      await docRef.delete().catch(() => { })
      return res.status(200).send({ success: true })
    }
  } catch (err) {
    console.error('endLiveMeeting function error:', err)
    return res.status(500).send({ error: String(err) })
  }
})
