import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile } from '../context/AuthContext';
import type { AcademicDepartment } from '../components/layout/HierarchicalSidebar';
import type { MeetingRecord } from '../features/meeting/MeetingHistory';

// ========================
// USERS
// ========================

export const saveUserProfile = async (userId: string, profile: Omit<UserProfile, 'id'>) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, { ...profile, createdAt: new Date() }, { merge: true });
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as UserProfile;
  }
  return null;
};

// ========================
// ACADEMIC STRUCTURE
// ========================

export const saveAcademicStructure = async (departments: AcademicDepartment[]) => {
  const structureRef = doc(db, 'academic_structure', 'main');
  await setDoc(structureRef, { departments, updatedAt: new Date() });
};

export const getAcademicStructure = async (): Promise<AcademicDepartment[] | null> => {
  const structureRef = doc(db, 'academic_structure', 'main');
  const snap = await getDoc(structureRef);
  if (snap.exists()) {
    return snap.data().departments as AcademicDepartment[];
  }
  return null;
};

// ========================
// MEETINGS
// ========================

export const saveMeetingRecord = async (meeting: Omit<MeetingRecord, 'id'>) => {
  const meetingsRef = collection(db, 'meetings');
  const docRef = await addDoc(meetingsRef, { ...meeting, createdAt: new Date() });
  return docRef.id;
};

export const subscribeToMeetings = (callback: (meetings: MeetingRecord[]) => void) => {
  const meetingsRef = collection(db, 'meetings');
  // In a real app you would order by date limit 50 etc.
  return onSnapshot(meetingsRef, (snapshot) => {
    const meetings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MeetingRecord));
    callback(meetings);
  });
};

// ========================
// REQUESTS
// ========================

// ========================
// LIVE MEETINGS
// ========================

export interface LiveMeetingInvite {
  id: string;
  title: string;
  sectionName: string;
  host: string;
  startedAt: Date;
  invitedStudents: string[]; // List of student IDs
}

export const startLiveMeeting = async (invite: LiveMeetingInvite) => {
  const meetingRef = doc(db, 'live_meetings', invite.id);
  await setDoc(meetingRef, { ...invite });
};

export const endLiveMeeting = async (meetingId: string) => {
  const meetingRef = doc(db, 'live_meetings', meetingId);
  await deleteDoc(meetingRef);
};

export const subscribeToLiveMeetings = (callback: (meetings: LiveMeetingInvite[]) => void) => {
  const meetingsRef = collection(db, 'live_meetings');
  return onSnapshot(meetingsRef, (snapshot) => {
    const meetings = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startedAt: data.startedAt?.toDate ? data.startedAt.toDate() : new Date(data.startedAt)
      } as LiveMeetingInvite;
    });
    callback(meetings);
  });
};

export const createStudentRequest = async (topic: string, preferredSlot: string, requestedBy: string, studentName: string) => {
  const requestsRef = collection(db, 'requests');
  const docRef = await addDoc(requestsRef, {
    topic,
    preferredSlot,
    requestedBy, // UID of the student
    studentName,
    status: 'Sent',
    createdAt: new Date()
  });
  return docRef.id;
};
