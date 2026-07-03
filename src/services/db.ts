import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs
} from 'firebase/firestore';
export { db } from '../config/firebase';
import { db, auth } from '../config/firebase';
import type { UserProfile } from '../context/AuthContext';
import type { AcademicBranch, AcademicDepartment, AcademicSection } from '../features/classWorkspace/types';
import type { MeetingRecord } from '../features/meeting/MeetingHistory';

// ========================
// DATE PARSING UTILITY
// ========================

export const parseFirestoreDate = (value: any): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
};

// ========================
// USERS & PRESENCE
// ========================

export const saveUserProfile = async (userId: string, profile: Omit<UserProfile, 'id'>) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, { ...profile, id: userId }, { merge: true });
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    return { id: userSnap.id, ...data } as UserProfile;
  }
  return null;
};

export const updateUserPresenceStatus = async (userId: string, status: 'online' | 'offline' | 'away' | 'in-meeting') => {
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, { presenceStatus: status, lastSeen: new Date() }, { merge: true });
};

const assertFacultyRole = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Unauthenticated user.');
};

// ========================
// ACADEMIC STRUCTURE
// ========================

const seedDefaultAcademicStructure = async () => {
  // Single department to bridge underlying layout tree (which expects dept -> branch -> section)
  await setDoc(doc(db, 'departments', 'UNIV'), { name: 'University', code: 'UNIV' });

  const branches = [
    { id: 'CSE', name: 'Computer Science Engineering' },
    { id: 'IT', name: 'Information Technology' },
    { id: 'AI', name: 'Artificial Intelligence' },
    { id: 'AIML', name: 'Artificial Intelligence & Machine Learning' },
    { id: 'DS', name: 'Data Science' },
    { id: 'ECE', name: 'Electronics & Communication' },
    { id: 'EEE', name: 'Electrical & Electronics' },
    { id: 'ME', name: 'Mechanical Engineering' },
    { id: 'CE', name: 'Civil Engineering' }
  ];

  for (const br of branches) {
    await setDoc(doc(db, 'branches', br.id), { name: br.name, departmentId: 'UNIV' });

    // Seed sections for years 1 to 4 and sections A to D
    const sections = ['A', 'B', 'C', 'D'];
    for (let yr = 1; yr <= 4; yr++) {
      for (const secName of sections) {
        const secId = `${br.id}_${yr}_${secName}`;
        
        let subject = 'General Subject';
        if (br.id === 'CSE') {
          const subjects = ['Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks', 'Software Engineering'];
          subject = subjects[(yr + secName.charCodeAt(0)) % subjects.length];
        } else if (br.id === 'AIML' || br.id === 'AI' || br.id === 'DS') {
          const subjects = ['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Computer Vision'];
          subject = subjects[(yr + secName.charCodeAt(0)) % subjects.length];
        } else if (br.id === 'IT') {
          const subjects = ['Cloud Computing', 'Cyber Security', 'Web Technologies'];
          subject = subjects[(yr + secName.charCodeAt(0)) % subjects.length];
        } else if (br.id === 'ECE' || br.id === 'EEE') {
          const subjects = ['Digital Electronics', 'Signals and Systems', 'Embedded Systems'];
          subject = subjects[(yr + secName.charCodeAt(0)) % subjects.length];
        } else {
          const subjects = ['Engineering Mechanics', 'Thermodynamics', 'Fluid Dynamics', 'Project Management'];
          subject = subjects[(yr + secName.charCodeAt(0)) % subjects.length];
        }

        await setDoc(doc(db, 'sections', secId), {
          name: secName,
          branchId: br.id,
          yearNumber: yr,
          subject: subject,
          facultyAdvisor: 'Dr. Rajan'
        });
      }
    }
  }
};

export const getAcademicStructure = async (): Promise<AcademicDepartment[]> => {
  let deptsSnap = await getDocs(collection(db, 'departments'));
  if (deptsSnap.empty) {
    await seedDefaultAcademicStructure();
    deptsSnap = await getDocs(collection(db, 'departments'));
  }
  const deptsList = deptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

  const branchesSnap = await getDocs(collection(db, 'branches'));
  const branchesList = branchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

  const sectionsSnap = await getDocs(collection(db, 'sections'));
  const sectionsList = sectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

  const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student'), where('status', '==', 'approved')));
  const studentsList = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

  const departments: AcademicDepartment[] = deptsList.map(dept => {
    const deptBranches = branchesList
      .filter(br => br.departmentId === dept.id)
      .map(br => {
        const brSections = sectionsList
          .filter(sec => sec.branchId === br.id)
          .map(sec => {
            const secStudents = studentsList
              .filter(s => s.branch === br.name && Number(s.year) === Number(sec.yearNumber) && s.section === sec.name)
              .map(s => ({
                id: s.id,
                name: s.name,
                email: s.email,
                attendancePct: s.attendancePct || 0,
                status: (s.presenceStatus === 'online' ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
                yearNumber: Number(s.year) || 1,
                semester: Number(s.semester) || 1,
              }));

            return {
              id: sec.id,
              name: sec.name,
              subject: sec.subject || '',
              facultyAdvisor: sec.facultyAdvisor || '',
              yearNumber: sec.yearNumber,
              students: secStudents,
            } as AcademicSection;
          });

        return {
          id: br.id,
          name: br.name,
          sections: brSections,
        } as AcademicBranch;
      });

    return {
      id: dept.id,
      name: dept.name,
      code: dept.code || dept.name.slice(0, 4).toUpperCase(),
      totalYears: 4,
      branches: deptBranches,
    } as AcademicDepartment;
  });

  return departments;
};

export const saveAcademicStructure = async (departments: AcademicDepartment[]) => {
  await assertFacultyRole();
  for (const dept of departments) {
    const deptRef = doc(db, 'departments', dept.id);
    await setDoc(deptRef, {
      name: dept.name,
      code: dept.code || dept.name.slice(0, 4).toUpperCase(),
    });

    if (dept.branches) {
      for (const branch of dept.branches) {
        const branchRef = doc(db, 'branches', branch.id);
        await setDoc(branchRef, {
          name: branch.name,
          departmentId: dept.id,
        });

        if (branch.sections) {
          for (const section of branch.sections) {
            const sectionRef = doc(db, 'sections', section.id);
            await setDoc(sectionRef, {
              name: section.name,
              branchId: branch.id,
              yearNumber: section.yearNumber || 1,
              subject: section.subject || '',
              facultyAdvisor: section.facultyAdvisor || '',
            });
          }
        }
      }
    }
  }
};

// ========================
// MEETINGS & HISTORY
// ========================

export const saveMeetingRecord = async (meeting: Omit<MeetingRecord, 'id'>) => {
  await assertFacultyRole();
  const docRef = doc(collection(db, 'meetings'));
  await setDoc(docRef, {
    ...meeting,
    id: docRef.id,
    date: meeting.date.toISOString(),
  });
  return docRef.id;
};

export const subscribeToMeetings = (callback: (meetings: MeetingRecord[]) => void, onError?: (error: any) => void) => {
  const meetingsRef = collection(db, 'meetings');
  return onSnapshot(meetingsRef, {
    next: (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          date: parseFirestoreDate(data.date),
        } as MeetingRecord;
      });
      callback(list);
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToMeetings error:', err);
    }
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
  classId?: string;
  facultyId?: string;
  department?: string;
  branch?: string;
  year?: number;
  section?: string;
  subject?: string;
  meetingCode?: string;
}

export const startLiveMeeting = async (channelName: string, details: Omit<LiveMeetingInvite, 'startedAt'>) => {
  await assertFacultyRole();
  const docRef = doc(db, 'live_meetings', channelName);
  await setDoc(docRef, {
    ...details,
    startedAt: new Date().toISOString(),
  });
};

export const endLiveMeeting = async (channelName: string) => {
  await assertFacultyRole();
  const docRef = doc(db, 'live_meetings', channelName);
  await deleteDoc(docRef);
};

export const subscribeToLiveMeetings = (callback: (invites: LiveMeetingInvite[]) => void, onError?: (error: any) => void) => {
  const colRef = collection(db, 'live_meetings');
  return onSnapshot(colRef, {
    next: (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          sectionName: data.sectionName,
          startedAt: parseFirestoreDate(data.startedAt),
          host: data.host || '',
          invitedStudents: data.invitedStudents || [],
          classId: data.classId,
          facultyId: data.facultyId,
          subject: data.subject,
        } as LiveMeetingInvite;
      });
      callback(list);
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToLiveMeetings error:', err);
    }
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

export const subscribeToDoubtRequests = (callback: (requests: StudentDoubtRequest[]) => void, onError?: (error: any) => void) => {
  const requestsRef = collection(db, 'requests');
  return onSnapshot(requestsRef, {
    next: (snapshot) => {
      const requests = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: parseFirestoreDate(data.createdAt)
        } as StudentDoubtRequest;
      });
      callback(requests);
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToDoubtRequests error:', err);
    }
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

export interface MeetingSummary {
  id: string;
  classId: string;
  meetingId: string;
  title: string;
  summary: string;
  topicsCovered?: string[];
  homework?: string;
  announcements?: string;
  recordingLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingAttendance {
  id: string;
  classId: string;
  meetingId: string;
  studentId: string;
  studentName: string;
  status: 'Present' | 'Absent' | 'Late';
  markedBy?: string;
  markedAt: Date;
}

export const createScheduledMeeting = async (meeting: Omit<ScheduledMeeting, 'id' | 'createdAt' | 'updatedAt'>) => {
  await assertFacultyRole();
  const docRef = doc(collection(db, 'scheduled_meetings'));
  await setDoc(docRef, {
    ...meeting,
    id: docRef.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
};

export const saveMeetingSummary = async (summary: Omit<MeetingSummary, 'id' | 'createdAt' | 'updatedAt'>) => {
  await assertFacultyRole();
  const docRef = doc(collection(db, 'meeting_summaries'));
  await setDoc(docRef, {
    ...summary,
    id: docRef.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
};

export const saveMeetingAttendance = async (attendance: Omit<MeetingAttendance, 'id' | 'markedAt'>) => {
  await assertFacultyRole();
  const docRef = doc(collection(db, 'meeting_attendance'));
  await setDoc(docRef, {
    ...attendance,
    id: docRef.id,
    markedAt: new Date().toISOString(),
  });
  return docRef.id;
};

export const subscribeToMeetingSummaries = (classId: string, callback: (summaries: MeetingSummary[]) => void, onError?: (error: any) => void) => {
  if (!classId) return () => {};
  const q = query(collection(db, 'meeting_summaries'), where('classId', '==', classId));
  return onSnapshot(q, {
    next: (snapshot) => {
      callback(snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as MeetingSummary;
      }));
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToMeetingSummaries error:', err);
    }
  });
};

export const subscribeToMeetingAttendance = (classId: string, callback: (attendance: MeetingAttendance[]) => void, onError?: (error: any) => void) => {
  if (!classId) return () => {};
  const q = query(collection(db, 'meeting_attendance'), where('classId', '==', classId));
  return onSnapshot(q, {
    next: (snapshot) => {
      callback(snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          markedAt: parseFirestoreDate(data.markedAt),
        } as MeetingAttendance;
      }));
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToMeetingAttendance error:', err);
    }
  });
};

export const updateScheduledMeeting = async (meetingId: string, updates: Partial<ScheduledMeeting>) => {
  await assertFacultyRole();
  const docRef = doc(db, 'scheduled_meetings', meetingId);
  await setDoc(docRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
};

export const deleteScheduledMeeting = async (meetingId: string) => {
  await assertFacultyRole();
  const docRef = doc(db, 'scheduled_meetings', meetingId);
  await deleteDoc(docRef);
};

export const subscribeToScheduledMeetings = (callback: (meetings: ScheduledMeeting[]) => void, onError?: (error: any) => void) => {
  const meetingsRef = collection(db, 'scheduled_meetings');
  return onSnapshot(meetingsRef, {
    next: (snapshot) => {
      const meetings = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt)
        } as ScheduledMeeting;
      });
      callback(meetings);
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToScheduledMeetings error:', err);
    }
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

export const subscribeToChatMessages = (meetingId: string, callback: (messages: ChatMessage[]) => void, onError?: (error: any) => void) => {
  if (!meetingId) return () => {};
  const messagesRef = collection(db, 'meetings', meetingId, 'messages');
  return onSnapshot(messagesRef, {
    next: (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
        } as ChatMessage;
      });
      callback(messages);
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToChatMessages error:', err);
    }
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

export const subscribeToWhiteboardStrokes = (meetingId: string, callback: (strokes: WhiteboardStroke[]) => void, onError?: (error: any) => void) => {
  if (!meetingId) return () => {};
  const whiteboardRef = collection(db, 'meetings', meetingId, 'whiteboard');
  return onSnapshot(whiteboardRef, {
    next: (snapshot) => {
      const strokes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
        } as WhiteboardStroke;
      });
      callback(strokes);
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToWhiteboardStrokes error:', err);
    }
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
  classId?: string;
  meetingId?: string;
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

export const subscribeToNotifications = (userId: string, callback: (notifications: AppNotification[]) => void, onError?: (error: any) => void) => {
  if (!userId) return () => {};
  const notificationsRef = collection(db, 'notifications');
  return onSnapshot(notificationsRef, {
    next: (snapshot) => {
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
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToNotifications error:', err);
    }
  });
};

// ========================
// FIREBASE STORAGE INTERACTION
// ========================

export const uploadFileToStorage = async (
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary is not configured.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  // 'raw' = documents (PDF, DOCX, etc.)
  // 'image' = images
  // 'video' = video/audio
  let resourceType = 'raw';
  if (file.type.startsWith('image/')) resourceType = 'image';
  else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) resourceType = 'video';

  // Note: onProgress is hard to emulate perfectly with fetch, 
  // but we can call it at start and end to prevent UI hangs.
  if (onProgress) onProgress(10);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Upload failed');
  }

  const data = await res.json();
  if (onProgress) onProgress(100);
  return data.secure_url;
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

export const subscribeToActivityLogs = (callback: (logs: ActivityLog[]) => void, onError?: (error: any) => void) => {
  const logsRef = collection(db, 'activity_logs');
  return onSnapshot(logsRef, {
    next: (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
        } as ActivityLog;
      });
      callback(logs);
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToActivityLogs error:', err);
    }
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

export const subscribeToSharedFiles = (meetingId: string, callback: (files: SharedFile[]) => void, onError?: (error: any) => void) => {
  if (!meetingId) return () => {};
  const filesRef = collection(db, 'meetings', meetingId, 'files');
  return onSnapshot(filesRef, {
    next: (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          uploadedAt: data.uploadedAt ? new Date(data.uploadedAt) : new Date()
        } as SharedFile;
      });
      callback(list);
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToSharedFiles error:', err);
    }
  });
};

// ========================
// MEETING CODE & ELIGIBILITY
// ========================

export const generateUniqueMeetingCode = async (deptCode: string = 'VP', year: number = 1, sectionName: string = 'A'): Promise<string> => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    let suffix = '';
    for (let i = 0; i < 5; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const cleanDept = deptCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanSection = sectionName.toUpperCase().replace(/[^A-Z0-9]/g, '');
    code = `${cleanDept}${year}${cleanSection}-${suffix}`;
    
    // Check if code has been reserved/used
    const codeDocRef = doc(db, 'meeting_codes', code);
    const codeDocSnap = await getDoc(codeDocRef);
    if (!codeDocSnap.exists()) {
      isUnique = true;
      // Reserve it immediately
      await setDoc(codeDocRef, { reserved: true, createdAt: new Date().toISOString() });
    }
  }
  return code;
};

export const verifyMeetingEligibility = (studentProfile: any, meeting: any): boolean => {
  if (!studentProfile || !meeting) return false;
  
  // Faculty is always eligible to join any meeting
  if (studentProfile.role === 'faculty') return true;
  
  const matchBranch = studentProfile.branch?.toLowerCase() === meeting.branch?.toLowerCase();
  const matchYear = Number(studentProfile.year) === Number(meeting.year);
  const matchSection = studentProfile.section?.toLowerCase() === meeting.section?.toLowerCase();
  
  return matchBranch && matchYear && matchSection;
};

// ========================
// STUDENT DIRECTORY & WORKFLOWS
// ========================

export const subscribeToAllStudents = (callback: (students: any[]) => void) => {
  const colRef = query(collection(db, 'users'), where('role', '==', 'student'));
  return onSnapshot(colRef, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(list);
  });
};

export const approveStudent = async (studentId: string, updates: any) => {
  await assertFacultyRole();
  const docRef = doc(db, 'users', studentId);
  await setDoc(docRef, {
    ...updates,
    status: 'approved',
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

export const rejectStudent = async (studentId: string) => {
  await assertFacultyRole();
  const docRef = doc(db, 'users', studentId);
  await setDoc(docRef, {
    status: 'rejected',
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

export const updateStudentAssignment = async (studentId: string, updates: any) => {
  await assertFacultyRole();
  const docRef = doc(db, 'users', studentId);
  await setDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

export const removeStudent = async (studentId: string) => {
  await assertFacultyRole();
  const docRef = doc(db, 'users', studentId);
  await deleteDoc(docRef);
};

export const getLiveMeetingByCode = async (code: string): Promise<any | null> => {
  if (!code) return null;
  const colRef = query(collection(db, 'live_meetings'), where('meetingCode', '==', code.trim().toUpperCase()));
  const snap = await getDocs(colRef);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const getBranchesAndSections = async () => {
  const branchesSnap = await getDocs(collection(db, 'branches'));
  const branches = branchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  const sectionsSnap = await getDocs(collection(db, 'sections'));
  const sections = sectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  return { branches, sections };
};

export const createClass = async (details: { name: string; subject: string; description?: string; facultyId: string; facultyName: string }) => {
  await assertFacultyRole();
  const classId = `class-${Date.now()}`;

  // Generate code: VP-XXX-4829
  const subjPrefix = details.subject.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const classCode = `VP-${subjPrefix}-${randomSuffix}`;
  const inviteLink = `${window.location.origin}/join/${classCode}`;

  const classDocRef = doc(db, 'classes', classId);
  const classPayload = {
    ...details,
    className: details.name,
    classCode,
    inviteLink,
    status: 'active',
    activeStudentCount: 0,
    meetingCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(classDocRef, classPayload);
  return { id: classId, ...classPayload };
};

export const updateClass = async (classId: string, updates: Record<string, unknown>) => {
  await assertFacultyRole();
  await setDoc(doc(db, 'classes', classId), {
    ...updates,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
};

export const archiveClass = async (classId: string) => {
  await updateClass(classId, { status: 'archived' });
};

export const joinClassByCode = async (studentId: string, studentName: string, studentEmail: string, classCode: string) => {
  if (!classCode) {
    throw new Error('Class code is required.');
  }
  const q = query(collection(db, 'classes'), where('classCode', '==', classCode.trim().toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error('Invalid class code. Please check and try again.');
  }
  const classDoc = snap.docs[0];
  const classData = classDoc.data();
  const classId = classDoc.id;

  const memberId = `${classId}_${studentId}`;
  const memberDocRef = doc(db, 'class_members', memberId);
  
  const payload = {
    classId,
    studentId,
    studentName,
    studentEmail,
    className: classData.name,
    subject: classData.subject,
    facultyName: classData.facultyName,
    enrolledAt: new Date().toISOString()
  };
  await setDoc(memberDocRef, payload);
  return { classId, className: classData.name };
};

export const subscribeToClasses = (
  role: 'faculty' | 'student',
  userId: string,
  callback: (classes: any[]) => void,
  onError?: (error: any) => void
) => {
  if (!userId) return () => {};
  if (role === 'faculty') {
    const q = query(collection(db, 'classes'), where('facultyId', '==', userId));
    return onSnapshot(q, {
      next: (snap) => {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      error: (err) => {
        if (onError) onError(err);
        else console.error('Firestore subscribeToClasses (faculty) error:', err);
      }
    });
  } else {
    const q = query(collection(db, 'class_members'), where('studentId', '==', userId));
    return onSnapshot(q, {
      next: async (snap) => {
        const members = snap.docs.map(doc => doc.data());
        if (members.length === 0) {
          callback([]);
          return;
        }
        const list: any[] = [];
        for (const m of members) {
          try {
            const classSnap = await getDoc(doc(db, 'classes', m.classId));
            if (classSnap.exists()) {
              list.push({ id: classSnap.id, ...classSnap.data() });
            }
          } catch (err) {
            console.error('Error fetching class details in subscribeToClasses:', err);
          }
        }
        callback(list);
      },
      error: (err) => {
        if (onError) onError(err);
        else console.error('Firestore subscribeToClasses (student) error:', err);
      }
    });
  }
};

export const subscribeToClassMeetings = (classId: string, callback: (meetings: any[]) => void, onError?: (error: any) => void) => {
  if (!classId) return () => {};
  const q = query(collection(db, 'meetings'), where('classId', '==', classId));
  return onSnapshot(q, {
    next: (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToClassMeetings error:', err);
    }
  });
};

export const subscribeToClassMaterials = (classId: string, callback: (materials: any[]) => void, onError?: (error: any) => void) => {
  if (!classId) return () => {};
  const q = query(collection(db, 'study_materials'), where('classId', '==', classId));
  return onSnapshot(q, {
    next: (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToClassMaterials error:', err);
    }
  });
};

export const subscribeToClassMembers = (classId: string, callback: (members: any[]) => void, onError?: (error: any) => void) => {
  if (!classId) return () => {};
  const q = query(collection(db, 'class_members'), where('classId', '==', classId));
  return onSnapshot(q, {
    next: (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToClassMembers error:', err);
    }
  });
};

export const uploadClassMaterial = async (classId: string, title: string, file: File | null, optionalUrl: string, uploadedBy: string) => {
  let fileUrl = optionalUrl;
  let fileName = file ? file.name : (optionalUrl ? 'External Link' : 'Unknown File');
  let fileSize = file ? `${(file.size / 1024).toFixed(1)} KB` : 'N/A';

  if (file) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary is not configured. Missing cloud name or upload preset.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    // 'raw' = documents (PDF, DOCX, etc.)
    // 'image' = images
    // 'video' = video/audio
    let resourceType = 'raw';
    if (file.type.startsWith('image/')) resourceType = 'image';
    else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) resourceType = 'video';

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || 'Failed to upload to Cloudinary');
    }

    const data = await res.json();
    fileUrl = data.secure_url;
  }

  const materialId = `material-${Date.now()}`;
  const docRef = doc(db, 'study_materials', materialId);
  await setDoc(docRef, {
    classId,
    title,
    fileName,
    fileUrl,
    fileSize,
    uploadedBy,
    uploadedAt: new Date().toISOString()
  });
};

export const deleteClassMaterial = async (materialId: string): Promise<void> => {
  await deleteDoc(doc(db, 'study_materials', materialId));
};

export const verifyClassMembership = async (studentId: string, classId: string): Promise<boolean> => {
  const memberId = `${classId}_${studentId}`;
  const snap = await getDoc(doc(db, 'class_members', memberId));
  return snap.exists();
};

export const subscribeToClassRecordings = (classId: string, callback: (recordings: any[]) => void, onError?: (error: any) => void) => {
  if (!classId) return () => {};
  const q = query(collection(db, 'meetings'), where('classId', '==', classId), where('recordingUrl', '!=', ''));
  return onSnapshot(q, {
    next: (snap) => {
      const recordings = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((m: any) => m.recordingUrl && m.recordingUrl !== '#')
      callback(recordings);
    },
    error: (err) => {
      if (onError) onError(err);
      else console.error('Firestore subscribeToClassRecordings error:', err);
    }
  });
};

export const deleteClass = async (classId: string) => {
  await assertFacultyRole();
  await deleteDoc(doc(db, 'classes', classId));
};

export const removeMemberFromClass = async (classId: string, studentId: string) => {
  await assertFacultyRole();
  const memberId = `${classId}_${studentId}`;
  await deleteDoc(doc(db, 'class_members', memberId));
};
