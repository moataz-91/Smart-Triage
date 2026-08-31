require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs'); 

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const DB_FILE = './database.json';
let db = { patients: {}, archives: [], socketToMrn: {} };

if (fs.existsSync(DB_FILE)) {
    try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } 
    catch (e) { console.error("⚠️ خطأ في قراءة ملف داتابيز، سيتم البدء بقاعدة جديدة."); }
}
if (!db.socketToMrn) db.socketToMrn = {};

function saveDatabase() {
    try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8'); } 
    catch (e) { console.error("❌ خطأ في حفظ الداتابيز:", e); }
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
        const testPrompt = `${SYSTEM_PROMPT}\n\nPatient Message: "أنا عندي صداع شديد بقاله يومين"\n\nGenerate JSON:`;
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: testPrompt,
            config: { responseMimeType: "application/json", temperature: 0.3 }
        });
        res.json({ status: "✅ نجح الاتصال", ai_response: JSON.parse(response.text) });
    } catch (error) {
        res.status(500).json({ status: "❌ خطأ", error: error.message });
    }
});

io.on('connection', (socket) => {
    console.log(`⚡ [New Connection]: Socket ID -> ${socket.id}`);

    socket.on('join_clinic_room', (roomName) => { socket.join(roomName); });

    socket.on('reconnect_patient_session', (data) => {
        const { mrn } = data;
        if (mrn && db.patients[mrn]) {
            db.socketToMrn[socket.id] = mrn;
            db.patients[mrn].socket_id = socket.id;
            saveDatabase();
            socket.emit('session_restored_success', { profile: db.patients[mrn] });
        }
    });

    socket.on('patient_register_intake', (profileData) => {
        const phone = profileData.phone || "غير محدد";
        let mrn = null;
        let isReturningPatient = false;

        const existingPatient = Object.values(db.patients).find(p => p.phone === phone && phone !== "غير محدد" && phone !== "");

        if (existingPatient) {
            mrn = existingPatient.mrn;
            isReturningPatient = true;
            db.patients[mrn].name = profileData.name;
            db.patients[mrn].age = profileData.age;
            db.patients[mrn].gender = profileData.gender;
            db.patients[mrn].chronic_diseases = profileData.chronic;
            db.patients[mrn].allergies = profileData.allergies;
            db.patients[mrn].socket_id = socket.id;
            db.patients[mrn].status = "In_Progress";
        } else {
            mrn = `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
            db.patients[mrn] = {
                mrn: mrn, phone: phone, name: profileData.name || "مريض غير معروف",
                age: profileData.age || "غير محدد", gender: profileData.gender || "غير محدد",
                chronic_diseases: profileData.chronic || "لا يوجد", allergies: profileData.allergies || "لا يوجد",
                registered_at: new Date().toISOString(), socket_id: socket.id, status: "In_Progress"
            };
        }

        db.socketToMrn[socket.id] = mrn;
        saveDatabase();
        
        socket.emit('intake_success', { mrn: mrn, profile: db.patients[mrn], isReturning: isReturningPatient });
        io.emit('doctor_patient_profile_update', db.patients[mrn]);
    });

    socket.on('patient_send_message', async (data) => {
        const { message, body_part } = data;
        const currentMrn = db.socketToMrn[socket.id];
        const patient = (currentMrn && db.patients[currentMrn]) ? db.patients[currentMrn] : { mrn: "N/A", name: "مريض عام", age: "N/A", phone: "N/A", chronic_diseases: "None" };
        
        try {
            const enrichedPrompt = `${SYSTEM_PROMPT}\n\nPATIENT PROFILE: MRN: ${patient.mrn} | Name: ${patient.name} | Age: ${patient.age} | Chronic: ${patient.chronic_diseases} | Allergies: ${patient.allergies} | Body Part: ${body_part || "General"}\nPatient Message: "${message}"\nGenerate JSON:`;

            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: enrichedPrompt,
                config: { responseMimeType: "application/json", temperature: 0.3 }
            });

            const parsedData = JSON.parse(response.text);

            if (patient.mrn !== "N/A") {
                const archiveRecord = {
                    mrn: patient.mrn, name: patient.name, phone: patient.phone, age: patient.age,
                    timestamp: new Date().toLocaleString('ar-EG'), triage_data: parsedData.doctor_dashboard,
                    status: patient.status || "In_Progress"
                };
                const existingIndex = db.archives.findIndex(a => a.mrn === patient.mrn);
                if (existingIndex > -1) { db.archives[existingIndex] = archiveRecord; } 
                else { db.archives.unshift(archiveRecord); }
                saveDatabase();
            }

            socket.emit('ai_patient_reply', parsedData.patient_chat);
            io.emit('doctor_dashboard_update', { ...parsedData.doctor_dashboard, patient_profile: patient });
        } catch (error) {
            console.error('❌ [AI Error]:', error);
            socket.emit('ai_patient_reply', { reply_text: "عذراً، حدث خطأ، ممكن تعيد آخر جملة؟", voice_tone: "neutral" });
        }
    });

    socket.on('finish_triage_session', () => {
        const currentMrn = db.socketToMrn[socket.id];
        if (currentMrn && db.patients[currentMrn]) {
            console.log(`🏁 [Triage Completed]: Patient ${currentMrn} finished interview.`);
            io.emit('patient_triage_completed_alert', { mrn: currentMrn });
        }
    });

    // 🟢 التعديل الجديد: الدكتور بيمسح المريض من القائمة بعد انتهاء الكشف
    socket.on('doctor_dismiss_patient', (data) => {
        const { mrn } = data;
        if (mrn && db.patients[mrn]) {
            db.patients[mrn].status = "Discharged"; // تغيير الحالة لـ "منتهي"
            const arcIndex = db.archives.findIndex(a => a.mrn === mrn);
            if (arcIndex > -1) { db.archives[arcIndex].status = "Discharged"; }
            saveDatabase();
            console.log(`✅ [Patient Discharged]: ${mrn} removed from active queue by Doctor.`);
            io.emit('remove_patient_from_queue', { mrn }); // أمر لكل الشاشات بمسح المريض ده
        }
    });

    socket.on('fetch_patient_archives', () => { socket.emit('archives_data_reply', db.archives); });

    socket.on('doctor_ambient_scribe', async (data) => {
        const { doctor_notes, current_mrn } = data;
        try {
            const scribePrompt = `${SYSTEM_PROMPT}\n\nDOCTOR NOTES: "${doctor_notes}". Synthesize to JSON.`;
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash', contents: scribePrompt,
                config: { responseMimeType: "application/json", temperature: 0.2 }
            });
            const parsedData = JSON.parse(response.text);
            if (current_mrn) {
                const existingIndex = db.archives.findIndex(a => a.mrn === current_mrn);
                if (existingIndex > -1) { db.archives[existingIndex].triage_data = parsedData.doctor_dashboard; saveDatabase(); }
            }
            socket.emit('ambient_scribe_completed', parsedData.doctor_dashboard);
        } catch (error) { console.error('❌ [Scribe Error]:', error); }
    });

    socket.on('doctor_secret_instruction', async (data) => {
        const { instruction } = data;
        try {
            const prompt = `${SYSTEM_PROMPT}\n\nURGENT INSTRUCTION: Ask the patient: "${instruction}"\nGenerate JSON:`;
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash', contents: prompt,
                config: { responseMimeType: "application/json", temperature: 0.3 }
            });
            const parsedData = JSON.parse(response.text);
            io.emit('ai_patient_reply', parsedData.patient_chat);
            io.emit('doctor_dashboard_update', parsedData.doctor_dashboard);
        } catch (error) { console.error('❌ [AI Error in Instruction]:', error); }
    });

    socket.on('request_active_queue', () => {
        const activePatients = Object.values(db.patients).filter(p => p.status === 'In_Progress');
        activePatients.forEach(p => {
            const archiveRec = db.archives.find(a => a.mrn === p.mrn);
            socket.emit('doctor_dashboard_update', { ...(archiveRec ? archiveRec.triage_data : {}), patient_profile: p });
        });
    });

    socket.on('disconnect', () => { console.log(`🔴 [Disconnected]: Socket ID -> ${socket.id}`); });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`🚀 Smart-AI-Triage Server is running isolated on http://localhost:${PORT}`);
});
