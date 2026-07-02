# Real-Time Application Integration Checklist

This project is currently a React/Vite frontend with local browser media, browser speech recognition, and several mock/demo flows. To make it a real production real-time application, these outside connections must be created and wired in.

## 1. Backend API

Required because the frontend must not hold secrets, create video-room tokens directly, or write trusted meeting records.

Recommended:
- Node.js + Express or NestJS
- Socket.IO or native WebSocket for app events
- Prisma for database access

You need to provide:
- Backend deployment target, such as Render, Railway, Fly.io, AWS, or your own server
- Public backend URL
- Secret values for `JWT_SECRET` and `SESSION_SECRET`

Place values:
- Server `.env`
- Frontend `.env.local`: `VITE_API_BASE_URL`, `VITE_REALTIME_URL`

Implementation steps:
1. Create backend project.
2. Add auth routes.
3. Add meeting routes.
4. Add token endpoint for the video provider.
5. Add WebSocket room events for chat, participant presence, hand raise, polls, attendance, and captions.
6. Deploy backend.
7. Set frontend `VITE_API_BASE_URL` and `VITE_REALTIME_URL`.

## 2. Database

Required for real users, faculty/student data, meetings, attendance, chat history, recordings, transcripts, and shared resources.

Recommended:
- Supabase Postgres or Neon Postgres

Free or paid:
- Both have free tiers, then paid as usage grows.

You need to provide:
- `DATABASE_URL`

Tables needed:
- users
- faculty_profiles
- students
- departments
- branches
- sections
- meetings
- meeting_participants
- attendance_records
- chat_messages
- polls
- poll_votes
- recordings
- transcripts
- shared_resources

Implementation steps:
1. Create Postgres database.
2. Add `DATABASE_URL` to backend `.env`.
3. Create Prisma schema/migrations.
4. Replace mock data in `src/App.tsx` and academic components with API calls.

## 3. Authentication

Required so faculty/students are real accounts instead of frontend-only demo users.

Recommended:
- Backend JWT/session auth, or Supabase Auth

Free or paid:
- Supabase Auth has a free tier.
- Custom JWT is free except hosting/database cost.

You need to provide:
- Auth choice
- Allowed email/domain rules if required

Implementation steps:
1. Build signup/login/logout endpoints.
2. Store password hashes or use managed auth.
3. Store role: faculty or student.
4. Protect meeting and academic APIs.
5. Replace frontend demo login logic with backend auth.

## 4. Real-Time Video/Audio Rooms

Required because the current app does not connect participants through a real meeting network.

Recommended:
- LiveKit Cloud

Alternatives:
- Daily
- Agora
- Twilio Video
- Self-hosted mediasoup
- Self-hosted Janus

Free or paid:
- LiveKit Cloud has a free tier and paid usage tiers.
- Self-hosted has server cost and more engineering work.

You need to provide:
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

Where to get it:
1. Go to `https://cloud.livekit.io`.
2. Create project.
3. Copy project URL.
4. Create API key and secret.
5. Put them in backend `.env`.

Implementation steps:
1. Backend creates meeting rooms.
2. Backend issues LiveKit access tokens per user.
3. Frontend joins LiveKit room using token.
4. Replace local participant simulation with real room participants.
5. Sync mute/video/screen-share state from LiveKit events.

## 5. Real-Time Captions

Current state:
- `MeetingRoom.tsx` uses browser `SpeechRecognition`.
- It can work without an API key in supported browsers, but it is not reliable enough for production and may depend on browser speech services.
- Captions are local to the speaker browser unless broadcast through a backend.

Recommended production provider:
- Deepgram streaming speech-to-text

Alternatives:
- AssemblyAI real-time
- Google Speech-to-Text streaming
- Azure Speech
- OpenAI realtime/transcription APIs

Free or paid:
- Most offer trials/free credits, then paid usage.

You need to provide one:
- `DEEPGRAM_API_KEY`, or
- `ASSEMBLYAI_API_KEY`, or
- `OPENAI_API_KEY`, or
- Google service account credentials

Deepgram steps:
1. Go to `https://console.deepgram.com`.
2. Create account/project.
3. Create API key.
4. Put `DEEPGRAM_API_KEY` in backend `.env`.

Implementation steps:
1. Capture microphone audio stream.
2. Send audio stream from frontend to backend or directly to provider using a short-lived token.
3. Receive partial and final transcripts.
4. Timestamp captions.
5. Broadcast caption events to everyone in the meeting via WebSocket.
6. Store final transcript segments in database.

## 6. Chat, Presence, Polls, Waiting Room, Hand Raise

Required because current state is local React state. Other users will not see the same state.

Recommended:
- Socket.IO rooms keyed by `meetingId`

You need to provide:
- Backend WebSocket deployment URL

Implementation steps:
1. User joins WebSocket room after auth.
2. Emit participant joined/left.
3. Emit mute/video/screen-share changes.
4. Emit chat messages.
5. Emit hand raise queue changes.
6. Emit poll creation/votes/results.
7. Emit waiting room admit/reject.
8. Persist important events in database.

## 7. Recording

Current state:
- The meeting room recording control was corrected so it no longer pretends to record.
- `ScreenRecording.tsx` records a local browser stream only; that is not a complete group meeting recording.

Recommended:
- LiveKit server-side recording/egress

Alternatives:
- Browser `MediaRecorder` for local-only recordings
- Custom SFU server-side recorder

Free or paid:
- LiveKit egress/recording has usage cost.
- Browser local recording is free but incomplete.

You need to provide:
- Recording provider choice
- Storage bucket credentials

Implementation steps:
1. Backend starts server-side recording for a room.
2. Provider writes recording file to storage.
3. Backend stores recording metadata in database.
4. Frontend shows recording status from backend events.
5. Frontend plays/downloads actual stored recording URL.

## 8. File And Recording Storage

Required for recordings, shared files, exported whiteboards, subtitles, and generated resources.

Recommended:
- Cloudflare R2 or AWS S3

Free or paid:
- R2 and S3 are paid by storage/requests; R2 has generous free usage.

You need to provide:
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_BASE_URL`

Cloudflare R2 steps:
1. Go to `https://dash.cloudflare.com`.
2. Open R2.
3. Create bucket.
4. Create API token/access keys.
5. Configure public URL or signed URL access.
6. Put values in backend `.env`.

Implementation steps:
1. Backend creates signed upload URLs.
2. Frontend uploads files directly to storage.
3. Backend saves file metadata.
4. Frontend lists/downloads real files.

## 9. Recorded Video Subtitles

Required if you want uploaded or recorded videos to have subtitles after the meeting.

Recommended:
- FFmpeg on backend for audio extraction and subtitle burn-in
- Deepgram/AssemblyAI/OpenAI Whisper for transcription

Free or paid:
- FFmpeg is free.
- Transcription provider is usually paid after free credits.

You need to provide:
- Transcription provider key
- Backend host that supports FFmpeg

Implementation steps:
1. Recording finishes and file is stored.
2. Backend downloads or streams recording.
3. FFmpeg extracts audio.
4. Transcription service returns timestamped transcript.
5. Backend generates `.vtt` and/or `.srt`.
6. Optional: FFmpeg burns subtitles into a new video.
7. Store subtitle files and final video in storage.
8. Frontend displays subtitle track and download/export buttons.

## 10. Email And Notifications

Required for invites, meeting summaries, absent-student follow-up, and scheduled reminders.

Recommended:
- Resend, SendGrid, Mailgun, or SMTP

Free or paid:
- Most have free tiers and paid sending plans.

You need to provide:
- SMTP/API credentials
- Sender email/domain

Implementation steps:
1. Verify sender domain.
2. Add credentials to backend `.env`.
3. Backend sends invite emails.
4. Backend sends recording/summary emails.
5. Store delivery status if needed.

## 11. Production Deployment

Required for real use outside localhost.

Recommended:
- Frontend: Vercel, Netlify, Cloudflare Pages
- Backend: Render, Railway, Fly.io, AWS, GCP, Azure
- Database: Supabase/Neon
- Storage: R2/S3

You need to provide:
- Domains
- Hosting accounts
- Environment variables for frontend and backend

Implementation steps:
1. Deploy backend.
2. Deploy frontend.
3. Configure CORS for frontend domain.
4. Configure WebSocket allowed origins.
5. Configure HTTPS.
6. Test camera/microphone permissions on HTTPS.

## Recommended Order

1. Backend API and database
2. Auth
3. Real-time WebSocket events
4. LiveKit video rooms
5. Real-time captions
6. Recording and storage
7. Recorded-video subtitle generation
8. Email notifications
9. Production deployment

## Values You Need To Send Me Before I Can Wire The External Parts

Do not send secrets in public chat. Put them in `.env.local` or backend `.env` and tell me which provider you chose.

Required choices:
- Video provider: LiveKit, Daily, Agora, Twilio, or self-hosted
- Caption provider: Deepgram, AssemblyAI, OpenAI, Google, or Azure
- Database provider: Supabase, Neon, local Postgres, or other
- Storage provider: Cloudflare R2, AWS S3, Supabase Storage, or other
- Auth approach: custom backend auth or managed auth
- Deployment target: local only, Vercel/Render, or another host

Minimum recommended set:
- LiveKit Cloud
- Deepgram
- Supabase Postgres
- Cloudflare R2
- Custom JWT backend
