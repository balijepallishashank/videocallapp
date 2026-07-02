import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { UserProfile } from '../context/AuthContext';
import type { AcademicDepartment } from '../components/layout/HierarchicalSidebar';
import type { MeetingRecord } from '../features/meeting/MeetingHistory';

// ========================
// USERS & PRESENCE
// ========================

export const saveUserProfile = async (userId: string, profile: Omit<UserProfile, 'id'>) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, { ...profile, id: userId }, { merge: true });
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
};

export const updateUserPresenceStatus = async (userId: string, status: 'online' | 'offline' | 'away' | 'in-meeting') => {
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, { presenceStatus: status, lastSeen: new Date() }, { merge: true });
};

// ========================
// ACADEMIC STRUCTURE
// ========================

export const getAcademicStructure = async (): Promise<AcademicDepartment[]> => {
  const docRef = doc(db, 'academic_structure', 'main');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data().departments || [];
  }
  return [];
};

export const saveAcademicStructure = async (departments: AcademicDepartment[]) => {
  const docRef = doc(db, 'academic_structure', 'main');
  await setDoc(docRef, { departments });
};

// ========================
// MEETINGS & HISTORY
// ========================

export const saveMeetingRecord = async (meeting: Omit<MeetingRecord, 'id'>) => {
  const docRef = doc(collection(db, 'meetings'));
  await setDoc(docRef, {
    ...meeting,
    id: docRef.id,
    date: meeting.date.toISOString(),
  });
  return docRef.id;
};

export const subscribeToMeetings = (callback: (meetings: MeetingRecord[]) => void) => {
  const meetingsRef = collection(db, 'meetings');
  return onSnapshot(meetingsRef, (snapshot) => {
    const list = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        date: new Date(data.date),
      } as MeetingRecord;
    });
    callback(list);
  });
};

// ========================
// LIVE SIGNALING
// ========================

export interface LiveMeetingInvite {
  id: string;
  title: string;
  sectionName: string;
  startedAt: Date;
  host: string;
  invitedStudents: string[];
}

export const startLiveMeeting = async (channelName: string, details: Omit<LiveMeetingInvite, 'startedAt'>) => {
  const docRef = doc(db, 'live_meetings', channelName);
  await setDoc(docRef, {
    ...details,
    startedAt: new Date().toISOString(),
  });
};

export const endLiveMeeting = async (channelName: string) => {
  const docRef = doc(db, 'live_meetings', channelName);
  await deleteDoc(docRef);
};

export const subscribeToLiveMeetings = (callback: (invites: LiveMeetingInvite[]) => void) => {
  const colRef = collection(db, 'live_meetings');
  return onSnapshot(colRef, (snapshot) => {
    const list = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        sectionName: data.sectionName,
        startedAt: new Date(data.startedAt),
        host: data.host || '',
        invitedStudents: data.invitedStudents || []
      } as LiveMeetingInvite;
    });
    callback(list);
  });
};

// ========================
// DOUBT REQUESTS
// ========================

export interface StudentDoubtRequest {
  id: string;
  topic: string;
  preferredSlot: string;
  requestedBy: string;
  studentName?: string;
  status: 'Sent' | 'Accepted' | 'Rescheduled' | 'Completed';
  createdAt: Date;
}

export const createStudentRequest = async (topic: string, preferredSlot: string, studentId: string, studentName: string) => {
  const docRef = doc(collection(db, 'requests'));
  await setDoc(docRef, {
    id: docRef.id,
    topic,
    preferredSlot,
    requestedBy: studentName,
    studentName,
    studentId,
    status: 'Sent',
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const subscribeToDoubtRequests = (callback: (requests: StudentDoubtRequest[]) => void) => {
  const requestsRef = collection(db, 'requests');
  return onSnapshot(requestsRef, (snapshot) => {
    const requests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
      } as StudentDoubtRequest;
    });
    callback(requests);
  });
};

export const updateDoubtRequestStatus = async (requestId: string, status: 'Sent' | 'Accepted' | 'Rescheduled' | 'Completed') => {
  const docRef = doc(db, 'requests', requestId);
  await setDoc(docRef, { status }, { merge: true });
};

// ========================
// SCHEDULED MEETINGS
// ========================

export interface ScheduledMeeting {
  id: string;
  meetingId: string;
  title: string;
  description?: string;
  facultyId: string;
  facultyName: string;
  department?: string;
  branch: string;
  year: number;
  section: string;
  invitedStudents: string[];
  scheduledDate: string; // ISO string
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'scheduled' | 'cancelled' | 'completed';
  duration?: number;
  participants?: string[];
  academicTarget?: any;
  recurring?: string;
  reminder?: number;
  meetingLink?: string;
}

export const createScheduledMeeting = async (meeting: Omit<ScheduledMeeting, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = doc(collection(db, 'scheduled_meetings'));
  await setDoc(docRef, {
    ...meeting,
    id: docRef.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
};

export const updateScheduledMeeting = async (meetingId: string, updates: Partial<ScheduledMeeting>) => {
  const docRef = doc(db, 'scheduled_meetings', meetingId);
  await setDoc(docRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
};

export const deleteScheduledMeeting = async (meetingId: string) => {
  const docRef = doc(db, 'scheduled_meetings', meetingId);
  await deleteDoc(docRef);
};

export const subscribeToScheduledMeetings = (callback: (meetings: ScheduledMeeting[]) => void) => {
  const meetingsRef = collection(db, 'scheduled_meetings');
  return onSnapshot(meetingsRef, (snapshot) => {
    const meetings = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      } as ScheduledMeeting;
    });
    callback(meetings);
  });
};

// ========================
// REAL-TIME CHAT
// ========================

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: Date;
  edited?: boolean;
  deleted?: boolean;
}

export const sendChatMessage = async (meetingId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
  const messagesRef = collection(db, 'meetings', meetingId, 'messages');
  const docRef = await addDoc(messagesRef, {
    ...message,
    timestamp: new Date().toISOString()
  });
  return docRef.id;
};

export const subscribeToChatMessages = (meetingId: string, callback: (messages: ChatMessage[]) => void) => {
  const messagesRef = collection(db, 'meetings', meetingId, 'messages');
  return onSnapshot(messagesRef, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
      } as ChatMessage;
    });
    callback(messages);
  });
};

// ========================
// WHITEBOARD SYNC
// ========================

export interface WhiteboardStroke {
  id: string;
  senderId: string;
  senderName: string;
  type: 'draw' | 'rect' | 'circle' | 'text' | 'clear' | 'square' | 'line';
  points?: Array<{ x: number; y: number }>;
  color: string;
  lineWidth: number;
  textValue?: string;
  timestamp: Date;
}

export const saveWhiteboardStroke = async (meetingId: string, stroke: Omit<WhiteboardStroke, 'id' | 'timestamp'>) => {
  const whiteboardRef = collection(db, 'meetings', meetingId, 'whiteboard');
  const docRef = await addDoc(whiteboardRef, {
    ...stroke,
    timestamp: new Date().toISOString()
  });
  return docRef.id;
};

export const clearWhiteboard = async (meetingId: string, senderId: string, senderName: string) => {
  await saveWhiteboardStroke(meetingId, {
    senderId,
    senderName,
    type: 'clear',
    color: '#000',
    lineWidth: 1
  });
};

export const subscribeToWhiteboardStrokes = (meetingId: string, callback: (strokes: WhiteboardStroke[]) => void) => {
  const whiteboardRef = collection(db, 'meetings', meetingId, 'whiteboard');
  return onSnapshot(whiteboardRef, (snapshot) => {
    const strokes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
      } as WhiteboardStroke;
    });
    callback(strokes);
  });
};

// ========================
// NOTIFICATIONS
// ========================

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: Date;
}

export const createNotification = async (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
  const docRef = doc(collection(db, 'notifications'));
  await setDoc(docRef, {
    ...notification,
    id: docRef.id,
    read: false,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const docRef = doc(db, 'notifications', notificationId);
  await setDoc(docRef, { read: true }, { merge: true });
};

export const deleteNotification = async (notificationId: string) => {
  const docRef = doc(db, 'notifications', notificationId);
  await deleteDoc(docRef);
};

export const subscribeToNotifications = (userId: string, callback: (notifications: AppNotification[]) => void) => {
  const notificationsRef = collection(db, 'notifications');
  return onSnapshot(notificationsRef, (snapshot) => {
    const list = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
        } as AppNotification;
      })
      .filter(n => n.userId === userId || n.userId === 'all');
    callback(list);
  });
};

// ========================
// FIREBASE STORAGE INTERACTION
// ========================

export const uploadFileToStorage = (
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadUrl);
      }
    );
  });
};

// ========================
// ACTIVITY LOGGING
// ========================

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  timestamp: Date;
}

export const logActivity = async (userId: string, userName: string, action: string, details?: string) => {
  const logsRef = collection(db, 'activity_logs');
  await addDoc(logsRef, {
    userId,
    userName,
    action,
    details: details || '',
    timestamp: new Date().toISOString()
  });
};

export const subscribeToActivityLogs = (callback: (logs: ActivityLog[]) => void) => {
  const logsRef = collection(db, 'activity_logs');
  return onSnapshot(logsRef, (snapshot) => {
    const logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
      } as ActivityLog;
    });
    callback(logs);
  });
};

// ========================
// FILE SHARING (MEETING SPACE)
// ========================

export interface SharedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export const addSharedFile = async (meetingId: string, file: Omit<SharedFile, 'id' | 'uploadedAt'>) => {
  const filesRef = collection(db, 'meetings', meetingId, 'files');
  const docRef = await addDoc(filesRef, {
    ...file,
    uploadedAt: new Date().toISOString()
  });
  return docRef.id;
};

export const deleteSharedFile = async (meetingId: string, fileId: string) => {
  const docRef = doc(db, 'meetings', meetingId, 'files', fileId);
  await deleteDoc(docRef);
};

export const subscribeToSharedFiles = (meetingId: string, callback: (files: SharedFile[]) => void) => {
  const filesRef = collection(db, 'meetings', meetingId, 'files');
  return onSnapshot(filesRef, (snapshot) => {
    const list = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        uploadedAt: data.uploadedAt ? new Date(data.uploadedAt) : new Date()
      } as SharedFile;
    });
    callback(list);
  });
};
