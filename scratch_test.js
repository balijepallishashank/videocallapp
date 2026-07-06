import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDpTqx2AnmRG6gdHl7Qm89Z-mF2NSaRaZs",
  authDomain: "videocallapp-2ee79.firebaseapp.com",
  projectId: "videocallapp-2ee79",
  storageBucket: "videocallapp-2ee79.firebasestorage.app",
  messagingSenderId: "297655828929",
  appId: "1:297655828929:web:23f1bf3ef74ad5aa3aef40"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function getOrRegisterUser(email, password, role, name) {
  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    uid = cred.user.uid;
    console.log(`Registered new user: ${email} (UID: ${uid})`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
      console.log(`Logged into existing user: ${email} (UID: ${uid})`);
    } else {
      throw err;
    }
  }

  const profileRef = doc(db, 'users', uid);
  await setDoc(profileRef, {
    email,
    name,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, { merge: true });
  console.log(`Firestore profile updated for: ${name} (${role})`);

  return uid;
}

async function run() {
  console.log('--- Starting Firebase End-to-End Test ---');

  const facultyUid = await getOrRegisterUser(
    'test_faculty@videopro.app',
    'testpassword123',
    'faculty',
    'Test Faculty'
  );

  const studentUid = await getOrRegisterUser(
    'test_student@videopro.app',
    'testpassword123',
    'student',
    'Test Student'
  );

  console.log('\nLogging in as Faculty...');
  await signInWithEmailAndPassword(auth, 'test_faculty@videopro.app', 'testpassword123');

  const classId = 'class-test-mock';
  const classRef = doc(db, 'classes', classId);
  await setDoc(classRef, {
    facultyId: facultyUid,
    facultyName: 'Test Faculty',
    name: 'Mock Software Engineering',
    className: 'Mock Software Engineering',
    subject: 'SE-101',
    description: 'This is a mock class for end-to-end testing.',
    classCode: 'VP-MOCK-7777',
    inviteLink: 'https://videopro.app/join/VP-MOCK-7777',
    status: 'active',
    activeStudentCount: 0,
    meetingCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  console.log(`Class created successfully under ID: ${classId} (Code: VP-MOCK-7777)`);

  console.log('\nLogging in as Student...');
  await signInWithEmailAndPassword(auth, 'test_student@videopro.app', 'testpassword123');

  const memberId = `${classId}_${studentUid}`;
  const memberRef = doc(db, 'class_members', memberId);
  await setDoc(memberRef, {
    classId,
    studentId: studentUid,
    studentName: 'Test Student',
    studentEmail: 'test_student@videopro.app',
    className: 'Mock Software Engineering',
    subject: 'SE-101',
    facultyName: 'Test Faculty',
    enrolledAt: new Date().toISOString()
  });
  console.log(`Student joined class successfully under Membership ID: ${memberId}`);

  console.log('\n--- End-to-End Test Completed Successfully! ---');
}

run().catch((err) => {
  console.error('\nTest failed with error:', err);
  process.exit(1);
});
