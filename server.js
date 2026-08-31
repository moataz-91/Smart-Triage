require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs'); // للتعامل مع قاعدة البيانات المحلية

const app = express();
const server = http.createServer(app);

// 🟢 التعديل السحري هنا: إضافة تصريح الـ CORS للسماح بالاتصال من اللاب توب أو Cloudflare
const io = new Server(server, {
    cors: {
        origin: "*", // السماح بجميع الروابط
        methods: ["GET", "POST"]
    }
});

app.use(express.static('public'));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// محرك حفظ الحالات وأرشيف المرضى (Database & EMR Persistence Engine)
const DB_FILE = './database.json';
let db = { patients: {}, archives: [], socketToMrn: {} };

// تحميل البيانات السابقة إن وجدت
if (fs.existsSync(DB_FILE)) {
    try { 
        db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); 
    } catch (e) { 
        console.error("⚠️ خطأ في قراءة ملف داتابيز، سيتم البدء بقاعدة جديدة."); 
    }
}
if (!db.socketToMrn) db.socketToMrn = {};

// دالة حفظ التغييرات في داتابيز
function saveDatabase() {
    try { 
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8'); 
    } catch (e) { 
        console.error("❌ خطأ في حفظ الداتابيز:", e); 
    }
}

const SYSTEM_PROMPT = `
You are an advanced, empathetic AI Clinical Triage Assistant.
Your goal is to interview the patient, ask dynamic medical follow-up questions, and extract structured clinical data for the doctor's real-time dashboard.

CRITICAL RULES:
1. Speak to the patient in their exact language and dialect (e.g., Egyptian Arabic, English, etc.) with empathy and professionalism.
2. Do NOT give a final medical diagnosis to the patient. Tell them the doctor will review everything shortly.
3. You MUST respond ONLY with a valid JSON object. Do not include any markdown formatting or extra text outside the JSON.

JSON OUTPUT STRUCTURE:
{
  "patient_chat": {
    "reply_text": "Text reply to speak or show to the patient",
    "voice_tone": "empathetic_calm"
  },
  "doctor_dashboard": {
    "chief_complaint": "Brief chief complaint in English or Arabic",
    "symptoms_timeline": "Duration and progression details",
    "red_flags_detected": ["Array of any critical/emergency symptoms mentioned, or empty array"],
    "ai_clinical_summary": "Professional medical summary for the physician",
    "recommended_specialty": "Choose ONLY ONE exactly from: (Orthopedics | Cardiology | Neurology | Internal Medicine | General Medicine)", 
    "differential_diagnosis": [
      {"condition": "Condition 1", "probability": "High"},
      {"condition": "Condition 2", "probability": "Medium"}
    ],
    "suggested_action": "Recommended next diagnostic step or test"
  }
}
`;

app.get('/test-ai', async (req, res) => {
    try {
        console.log("🛠️ جاري فحص الـ AI عبر المتصفح...");
        const testPrompt = `${SYSTEM_PROMPT}\n\nPatient Message: "أنا عندي صداع شديد بقاله يومين ومش قادر أفتح عيني من الضوء وحاسس بزغللة"\n\nGenerate the JSON output now:`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: testPrompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.3
            }
        });

        const parsedData = JSON.parse(response.text);
        res.json({
            status: "✅ نجح الاتصال بالذكاء الاصطناعي بنسبة 100%!",
            message_sent: "أنا عندي صداع شديد بقاله يومين ومش قادر أفتح عيني من الضوء وحاسس بزغللة",
            ai_response: parsedData
        });
    } catch (error) {
        console.error("❌ خطأ في الفحص:", error);
        res.status(500).json({ status: "❌ حدث خطأ في الاتصال", error: error.message });
    }
});

io.on('connection', (socket) => {
    console.log(`⚡ [New Connection]: Socket ID -> ${socket.id}`);

    // نظام الغرف لعزل العيادات عن بعضها (Multi-Clinic Rooms)
    socket.on('join_clinic_room', (roomName) => {
        socket.join(roomName);
        console.log(`🏥 [Room Joined]: Socket ${socket.id} joined clinic -> ${roomName}`);
    });

    // إعادة ربط المريض بملفه القديم عند تحديث الصفحة (F5)
    socket.on('reconnect_patient_session', (data) => {
        const { mrn } = data;
        if (mrn && db.patients[mrn]) {
            db.socketToMrn[socket.id] = mrn;
            db.patients[mrn].socket_id = socket.id;
            saveDatabase();
            console.log(`🔄 [Session Restored]: Patient (${mrn}) reconnected successfully on Socket ${socket.id}`);
            socket.emit('session_restored_success', { profile: db.patients[mrn] });
        }
    });

    // تسجيل بيانات المريض (Intake Modal) وتوليد رقم الملف الطبي (MRN) مع البحث برقم الهاتف
    socket.on('patient_register_intake', (profileData) => {
        const phone = profileData.phone || "غير محدد";
        let mrn = null;
        let isReturningPatient = false;

        // البحث هل المريض مسجل مسبقاً بنفس رقم الهاتف؟
        const existingPatient = Object.values(db.patients).find(p => p.phone === phone && phone !== "غير محدد" && phone !== "");

        if (existingPatient) {
            mrn = existingPatient.mrn;
            isReturningPatient = true;
            // تحديث بياناته في حالة تغييرها
            db.patients[mrn].name = profileData.name;
            db.patients[mrn].age = profileData.age;
            db.patients[mrn].gender = profileData.gender;
            db.patients[mrn].chronic_diseases = profileData.chronic;
            db.patients[mrn].allergies = profileData.allergies;
            db.patients[mrn].socket_id = socket.id;
            db.patients[mrn].status = "In_Progress";
            console.log(`🪪 [Returning Patient]: ${profileData.name} found by phone. Restoring MRN: ${mrn}`);
        } else {
            mrn = `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
            db.patients[mrn] = {
                mrn: mrn,
                phone: phone,
                name: profileData.name || "مريض غير معروف",
                age: profileData.age || "غير محدد",
                gender: profileData.gender || "غير محدد",
                chronic_diseases: profileData.chronic || "لا يوجد",
                allergies: profileData.allergies || "لا يوجد",
                registered_at: new Date().toISOString(),
                socket_id: socket.id,
                status: "In_Progress"
            };
            console.log(`🪪 [New Patient Registered]: ${profileData.name} (${mrn})`);
        }

        db.socketToMrn[socket.id] = mrn;
        saveDatabase();
        
        socket.emit('intake_success', { mrn: mrn, profile: db.patients[mrn], isReturning: isReturningPatient });
        io.emit('doctor_patient_profile_update', db.patients[mrn]);
    });

    socket.on('patient_send_message', async (data) => {
        const { message, body_part } = data;
        console.log(`🗣️ [Patient Says]: ${message} (Body Part: ${body_part || 'General'})`);

        const currentMrn = db.socketToMrn[socket.id];
        const patient = (currentMrn && db.patients[currentMrn]) ? db.patients[currentMrn] : { mrn: "N/A", name: "مريض عام", age: "N/A", phone: "N/A", chronic_diseases: "None" };
        
        try {
            const enrichedPrompt = `${SYSTEM_PROMPT}\n\nPATIENT PROFILE & EMR CONTEXT:
            - MRN: ${patient.mrn} | Name: ${patient.name} | Age: ${patient.age} | Phone: ${patient.phone}
            - Chronic Diseases: ${patient.chronic_diseases} | Allergies: ${patient.allergies}
            - Selected Body Map Area: ${body_part || "Not specified"}
            
            Patient Message: "${message}"\n\nGenerate the JSON output now, taking into account their chronic conditions:`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: enrichedPrompt,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.3
                }
            });

            const parsedData = JSON.parse(response.text);

            if (patient.mrn !== "N/A") {
                const archiveRecord = {
                    mrn: patient.mrn,
                    name: patient.name,
                    phone: patient.phone,
                    age: patient.age,
                    timestamp: new Date().toLocaleString('ar-EG'),
                    triage_data: parsedData.doctor_dashboard,
                    status: patient.status || "In_Progress"
                };
                const existingIndex = db.archives.findIndex(a => a.mrn === patient.mrn);
                if (existingIndex > -1) {
                    db.archives[existingIndex] = archiveRecord;
                } else {
                    db.archives.unshift(archiveRecord);
                }
                saveDatabase();
            }

            socket.emit('ai_patient_reply', parsedData.patient_chat);
            
            io.emit('doctor_dashboard_update', { ...parsedData.doctor_dashboard, patient_profile: patient });
            if (parsedData.doctor_dashboard.recommended_specialty) {
                io.to(parsedData.doctor_dashboard.recommended_specialty).emit('clinic_room_update', { ...parsedData.doctor_dashboard, patient_profile: patient });
            }

            console.log(`✅ [Triage Success]: Dashboard updated & archived for ${patient.name}.`);
        } catch (error) {
            console.error('❌ [AI Error]:', error);
            socket.emit('ai_patient_reply', { 
                reply_text: "عذراً، حدث خطأ بسيط في الاتصال، ممكن تعيد آخر جملة؟", 
                voice_tone: "neutral" 
            });
        }
    });

    // إنهاء المحادثة وإشعار الطبيب بأن المريض جاهز
    socket.on('finish_triage_session', () => {
        const currentMrn = db.socketToMrn[socket.id];
        if (currentMrn && db.patients[currentMrn]) {
            db.patients[currentMrn].status = "Completed";
            const arcIndex = db.archives.findIndex(a => a.mrn === currentMrn);
            if (arcIndex > -1) {
                db.archives[arcIndex].status = "Completed";
            }
            saveDatabase();

            console.log(`🏁 [Triage Completed]: Patient ${currentMrn} finished interview.`);
            io.emit('patient_triage_completed_alert', { mrn: currentMrn, profile: db.patients[currentMrn] });
        }
    });

    // طلب الطبيب لعرض أرشيف الحالات المسجلة
    socket.on('fetch_patient_archives', () => {
        socket.emit('archives_data_reply', db.archives);
    });

    // المساعد الصوتي الممتد لغرفة الكشف (AI Ambient Scribe)
    socket.on('doctor_ambient_scribe', async (data) => {
        const { doctor_notes, current_mrn } = data;
        console.log(`🎙️ [Ambient Scribe Notes]: ${doctor_notes} (MRN: ${current_mrn})`);

        try {
            const scribePrompt = `${SYSTEM_PROMPT}\n\nCRITICAL DOCTOR EXAMINATION ROOM NOTES:
            The doctor just performed a physical examination and spoke the following real-time notes: "${doctor_notes}".
            Synthesize these physical findings with any existing triage data to generate a definitive, highly polished clinical SOAP note in the JSON doctor_dashboard format.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: scribePrompt,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.2
                }
            });

            const parsedData = JSON.parse(response.text);

            if (current_mrn) {
                const existingIndex = db.archives.findIndex(a => a.mrn === current_mrn);
                if (existingIndex > -1) {
                    db.archives[existingIndex].triage_data = parsedData.doctor_dashboard;
                    saveDatabase();
                }
            }

            socket.emit('ambient_scribe_completed', parsedData.doctor_dashboard);
            console.log(`✅ [Ambient Scribe Success]: Finalized SOAP Note generated.`);
        } catch (error) {
            console.error('❌ [Scribe Error]:', error);
        }
    });

    // استقبال التوجيه السري من الطبيب وإرساله للمريض فوراً
    socket.on('doctor_secret_instruction', async (data) => {
        const { instruction } = data;
        console.log(`👨‍⚕️ [Doctor Secret Instruction]: ${instruction}`);

        try {
            const prompt = `${SYSTEM_PROMPT}\n\nCRITICAL URGENT INSTRUCTION FROM THE DOCTOR: You must immediately ask the patient the following question or steer the conversation to this topic in an empathetic, natural way: "${instruction}"\n\nGenerate the JSON output now to speak to the patient:`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.3
                }
            });

            const parsedData = JSON.parse(response.text);

            io.emit('ai_patient_reply', parsedData.patient_chat);
            io.emit('doctor_dashboard_update', parsedData.doctor_dashboard);

            console.log(`✅ [Secret Instruction Sent Successfully]`);
        } catch (error) {
            console.error('❌ [AI Error in Instruction]:', error);
        }
    });

    // 🟢 الإصلاح: بيبعت للدكتور كل الحالات النشطة أول ما يفتح الصفحة أو يعمل ريفريش
    // (قبل كده الداشبورد كانت بتفضل فاضية لحد أول رسالة جديدة "live")
    socket.on('request_active_queue', () => {
        const activePatients = Object.values(db.patients).filter(p => p.status === 'In_Progress');
        console.log(`📋 [Active Queue Requested]: بعتنا ${activePatients.length} حالة نشطة لـ Socket ${socket.id}`);
        activePatients.forEach(p => {
            const archiveRec = db.archives.find(a => a.mrn === p.mrn);
            socket.emit('doctor_dashboard_update', {
                ...(archiveRec ? archiveRec.triage_data : {}),
                patient_profile: p
            });
        });
    });

    socket.on('disconnect', () => {
        console.log(`🔴 [Disconnected]: Socket ID -> ${socket.id}`);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`🚀 Smart-AI-Triage Server is running isolated on http://localhost:${PORT}`);
    console.log(`🔍 للفحص والتأكد من عمل الـ AI افتح: http://localhost:${PORT}/test-ai`);
});
