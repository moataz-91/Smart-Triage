<!DOCTYPE html>
<html lang="en" dir="ltr" id="html-root">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Triage CDSS - Doctor Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Tajawal', sans-serif; }
        body { background-color: #f1f5f9; color: #1e293b; padding: 20px; transition: 0.3s; user-select: none; -webkit-user-select: none; -ms-user-select: none; }
        input, select, textarea { user-select: auto; -webkit-user-select: auto; -ms-user-select: auto; }
        
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: white; padding: 20px 30px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header-title h1 { font-size: 1.6rem; margin-bottom: 5px; color: #38bdf8; }
        .header-title p { font-size: 0.9rem; color: #94a3b8; }
        .live-indicator { display: flex; align-items: center; gap: 8px; background: rgba(56, 189, 248, 0.1); border: 1px solid #38bdf8; padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; font-weight: bold; color: #38bdf8; }
        .pulse-dot { width: 10px; height: 10px; background: #22c55e; border-radius: 50%; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }

        .grid-container { display: grid; grid-template-columns: repeat(12, 1fr); gap: 20px; }
        .card { background: white; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); }
        
        .col-4 { grid-column: span 4; }
        .col-6 { grid-column: span 6; }
        .col-8 { grid-column: span 8; }
        .col-12 { grid-column: span 12; }
        
        @media (max-width: 992px) { .col-4, .col-6, .col-8 { grid-column: span 12; } }

        .card-title { font-size: 1.1rem; color: #64748b; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; font-weight: bold; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
        
        .value-text { font-size: 1.3rem; font-weight: bold; color: #0f172a; line-height: 1.5; }
        .summary-box { background: #f8fafc; border-right: 4px solid #0ea5e9; padding: 15px; border-radius: 8px; font-size: 1.05rem; line-height: 1.6; color: #334155; }
        html[dir="ltr"] .summary-box { border-right: none; border-left: 4px solid #0ea5e9; }
        
        .red-flags-container { display: flex; flex-wrap: wrap; gap: 10px; }
        .flag-tag { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 8px 14px; border-radius: 8px; font-weight: bold; display: flex; align-items: center; gap: 6px; animation: bounceIn 0.5s; }
        .no-flags { background: #dcfce7; color: #16a34a; border: 1px solid #86efac; padding: 8px 14px; border-radius: 8px; font-weight: bold; }
        @keyframes bounceIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        
        .emergency-pulse { animation: emergencyGlow 1.5s infinite !important; border: 2px solid #ef4444 !important; }
        @keyframes emergencyGlow { 0% { box-shadow: 0 0 5px #ef4444; } 50% { box-shadow: 0 0 20px #ef4444, inset 0 0 10px #fca5a5; } 100% { box-shadow: 0 0 5px #ef4444; } }

        .diag-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
        .diag-item { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; }
        .diag-name { font-weight: bold; font-size: 1.05rem; color: #1e293b; }
        .prob-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; }
        .prob-High { background: #fee2e2; color: #dc2626; }
        .prob-Medium { background: #fef3c7; color: #d97706; }
        .prob-Low { background: #e0f2fe; color: #0284c7; }

        .waiting-state { text-align: center; padding: 40px; color: #94a3b8; }
        .waiting-state i { font-size: 3rem; display: block; margin-bottom: 15px; }

        .patient-profile-bar { background: #1e293b; color: white; padding: 15px 25px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid #38bdf8; flex-wrap: wrap; gap: 10px; }
        html[dir="rtl"] .patient-profile-bar { border-left: none; border-right: 5px solid #38bdf8; }
        .profile-info span { margin: 0 10px; font-size: 0.95rem; }
        .profile-info strong { color: #38bdf8; }
        
        .archives-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 100; justify-content: center; align-items: center; padding: 30px; }
        .archives-content { background: white; width: 100%; max-width: 950px; max-height: 85vh; border-radius: 16px; padding: 25px; overflow-y: auto; }
        .archives-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .archives-table th, .archives-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
        html[dir="rtl"] .archives-table th, html[dir="rtl"] .archives-table td { text-align: right; }
        .archives-table th { background: #f8fafc; color: #475569; }
        .btn-view-archive { background: #0284c7; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
        
        .lang-switch-btn { background: #f59e0b; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; font-family: inherit; display: flex; align-items: center; gap: 6px; }
        .lang-switch-btn:hover { background: #d97706; }
    </style>
</head>
<body>

    <div class="archives-modal" id="archives-modal">
        <div class="archives-content">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px;">
                <h3 id="txt-arc-title" style="color: #0f172a; font-size: 1.4rem;">🗄️ Patient EMR Archives</h3>
                <button onclick="document.getElementById('archives-modal').style.display='none'" id="txt-arc-close" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer;">❌ Close</button>
            </div>
            <table class="archives-table">
                <thead>
                    <tr>
                        <th id="txt-arc-th-mrn">MRN</th>
                        <th id="txt-arc-th-phone">Phone</th>
                        <th id="txt-arc-th-name">Patient Name</th>
                        <th id="txt-arc-th-age">Age</th>
                        <th id="txt-arc-th-time">Time</th>
                        <th id="txt-arc-th-chief">Chief Complaint</th>
                        <th id="txt-arc-th-action">Actions</th>
                    </tr>
                </thead>
                <tbody id="archives-table-body">
                    <tr><td colspan="7" id="txt-arc-loading" style="text-align: center;">Loading archives...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <header class="dashboard-header">
        <div class="header-title">
            <h1 id="txt-head-title">📋 Smart Triage System (CDSS) - Doctor Dashboard</h1>
            <p id="txt-head-desc">Real-time AI patient interview analysis and clinical reporting</p>
        </div>
        
        <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
            <button id="lang-toggle-btn" class="lang-switch-btn">🌐 العربية / Arabic</button>
            <button id="open-archives-btn" style="background: #3b82f6; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; font-family: inherit;">🗄️ Patient Archives & EMR</button>
            <select id="clinic-filter" style="padding: 10px 15px; border-radius: 8px; border: 1px solid #38bdf8; background: #1e293b; color: white; font-weight: bold; outline: none; cursor: pointer; font-family: inherit;">
                <option value="All" id="opt-all">🏥 All Clinics (General Triage)</option>
                <option value="Orthopedics" id="opt-ortho">🦴 Orthopedics</option>
                <option value="Cardiology" id="opt-cardio">❤️ Cardiology</option>
                <option value="Neurology" id="opt-neuro">🧠 Neurology</option>
                <option value="Internal Medicine" id="opt-internal">💊 Internal Medicine</option>
                <option value="General Medicine" id="opt-general">🩺 General Medicine</option>
            </select>
            <button id="export-soap-btn" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: 0.2s; font-family: inherit;">🖨️ Export SOAP Note</button>
            <div class="live-indicator">
                <div class="pulse-dot"></div>
                <span id="txt-live-stream">Live Clinic Stream</span>
            </div>
        </div>
    </header>

    <div style="background: #ffffff; border: 2px solid #0284c7; border-radius: 12px; padding: 15px 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
            <span id="txt-queue-title" style="font-weight: bold; color: #0f172a; font-size: 1.05rem; display: flex; align-items: center; gap: 8px;">
                👥 Live Patient Queue & Active Cases:
            </span>
            <span id="queue-count-badge" style="background: #0284c7; color: white; padding: 2px 10px; border-radius: 15px; font-size: 0.85rem; font-weight: bold;">0 active cases</span>
        </div>
        <div id="active-patients-queue" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px;">
            <span id="txt-queue-empty" style="color: #64748b; font-size: 0.9rem;">⏳ No active patients in the queue currently...</span>
        </div>
    </div>

    <!-- 🟢 الشريط الخاص ببيانات المريض والزرار الجديد -->
    <div class="patient-profile-bar" id="patient-profile-bar">
        <div class="profile-info">
            <span id="lbl-emr-name">👤 Current Patient: <strong id="emr-name">Waiting for patient...</strong></span>
            <span id="lbl-emr-mrn">🪪 MRN: <strong id="emr-mrn">---</strong></span>
            <span id="lbl-emr-phone">📱 Phone: <strong id="emr-phone">---</strong></span>
            <span id="lbl-emr-age">🎂 Age: <strong id="emr-age">---</strong></span>
            <span id="lbl-emr-gender">⚧ Gender: <strong id="emr-gender">---</strong></span>
        </div>
        <div class="profile-info" style="display: flex; align-items: center; gap: 20px;">
            <div style="color: #fca5a5; display: flex; flex-direction: column; gap: 5px;">
                <span id="lbl-emr-chronic">💊 Chronic: <strong id="emr-chronic" style="color: white;">---</strong></span>
                <span id="lbl-emr-allergies">⚠️ Allergies: <strong id="emr-allergies" style="color: white;">---</strong></span>
            </div>
            <!-- زرار إنهاء الكشف ومسح المريض -->
            <button id="dismiss-patient-btn" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; font-family: inherit; display: none; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">✅ Dismiss Patient</button>
        </div>
    </div>

    <main class="grid-container" id="dashboard-content">
        <div class="card col-12" style="background: #fdfbf7; border: 2px solid #f59e0b;">
            <div class="card-title" id="txt-scribe-title" style="color: #b45309;">🎙️ Clinical Examination Room Scribe</div>
            <p id="txt-scribe-desc" style="font-size: 0.9rem; color: #64748b; margin-bottom: 10px;">Click microphone and speak clinical findings during physical examination to record notes, then click merge to let AI synthesize findings with patient chat into a finalized SOAP note:</p>
            <div style="display: flex; gap: 10px;">
                <button id="scribe-mic-btn" style="background: #f59e0b; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px;">🎙️ Start Scribe Mic</button>
                <input type="text" id="scribe-input" placeholder="Clinical examination notes will appear here automatically..." style="flex: 1; padding: 12px 15px; border: 1px solid #fcd34d; border-radius: 8px; font-size: 0.95rem; outline: none;">
                <button id="send-scribe-btn" style="background: #15803d; color: white; border: none; padding: 10px 25px; border-radius: 8px; font-weight: bold; cursor: pointer;">⚡ Merge & Generate Final Report</button>
            </div>
        </div>

        <div class="card col-12" style="background: #eff6ff; border: 2px dashed #3b82f6;">
            <div class="card-title" id="txt-secret-title" style="color: #1d4ed8;">🕵️‍♂️ Live Assistant Override (Secret Instruction)</div>
            <div style="display: flex; gap: 10px;">
                <input type="text" id="secret-input" placeholder="Type a secret instruction or question for the AI to ask immediately..." style="flex: 1; padding: 12px 15px; border: 1px solid #93c5fd; border-radius: 8px; font-size: 1rem; outline: none;">
                <button id="send-secret-btn" style="background: #2563eb; color: white; border: none; padding: 10px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s;">⚡ Send Override Now</button>
            </div>
        </div>

        <div class="card col-12" id="routing-card" style="background: #fdf4ff; border: 2px solid #d8b4fe; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; padding: 15px 25px;">
            <div>
                <span id="txt-routing-title" style="font-weight: bold; color: #7e22ce; font-size: 1.1rem;">🎯 AI Specialty Routing:</span>
                <span id="ai-specialty-badge" style="background: #9333ea; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin: 0 10px; display: inline-block;">Sorting...</span>
            </div>
            <span id="routing-status" style="font-size: 0.95rem; color: #6b7280; font-weight: bold;">✔️ Currently viewed in your dashboard</span>
        </div>

        <div class="card col-4">
            <div class="card-title" id="txt-chief-title">📌 Chief Complaint</div>
            <div class="value-text" id="chief-complaint">Waiting for patient...</div>
        </div>

        <div class="card col-4">
            <div class="card-title" id="txt-timeline-title">⏱️ Symptoms Timeline</div>
            <div class="value-text" id="symptoms-timeline" style="color: #0284c7;">Waiting for speech...</div>
        </div>

        <div class="card col-4" style="border-top: 4px solid #ef4444;">
            <div class="card-title" id="txt-flags-title" style="color: #ef4444;">🚨 Red Flags Radar</div>
            <div class="red-flags-container" id="red-flags">
                <span class="no-flags" id="txt-no-flags">✔️ No critical red flags detected so far</span>
            </div>
        </div>

        <div class="card col-8">
            <div class="card-title" id="txt-summary-title">📝 AI Clinical Summary</div>
            <div class="summary-box" id="clinical-summary">
                Once the patient begins speaking, the AI will filter colloquial speech...
            </div>
        </div>

        <div class="card col-4" style="background: #f0fdf4; border: 1px solid #bbf7d0;">
            <div class="card-title" id="txt-action-title" style="color: #16a34a;">💡 Suggested Action</div>
            <div class="value-text" id="suggested-action" style="font-size: 1.1rem; color: #15803d;">Evaluating...</div>
        </div>

        <div class="card col-12">
            <div class="card-title" id="txt-diag-title">🎯 Differential Diagnosis</div>
            <ul class="diag-list" id="differential-list">
                <li class="waiting-state" id="txt-diag-waiting">Analyzing symptoms...</li>
            </ul>
        </div>
    </main>

    <script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
    <script>
        document.addEventListener('contextmenu', event => event.preventDefault()); 
        
        const socket = io("http://78.47.133.206:4000"); 

        socket.on('connect', () => {
            console.log('🔌 Connected');
            socket.emit('request_active_queue');
        });
        
        let currentSpecialty = "General Medicine";
        let currentLang = 'en';
        window.activePatientsMap = {}; 
        window.lockedMRN = null;
        
        const clinicFilter = document.getElementById('clinic-filter');
        const routingCard = document.getElementById('routing-card');
        const routingStatus = document.getElementById('routing-status');
        const dismissBtn = document.getElementById('dismiss-patient-btn');

        const notificationSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');

        const i18n = {
            en: {
                btnToggle: "🌐 العربية / Arabic", btnArchives: "🗄️ Archives", btnSOAP: "🖨️ Export SOAP",
                liveStream: "Live Clinic Stream", optAll: "🏥 All Clinics", optOrtho: "🦴 Orthopedics",
                optCardio: "❤️ Cardiology", optNeuro: "🧠 Neurology", optInternal: "💊 Internal", optGeneral: "🩺 General",
                lblPatient: "👤 Current Patient: ", lblMRN: "🪪 MRN: ", lblPhone: "📱 Phone: ", lblAge: "🎂 Age: ",
                lblGender: "⚧ Gender: ", lblChronic: "💊 Chronic: ", lblAllergies: "⚠️ Allergies: ",
                valWaitingPatient: "Waiting for patient...", valWaitingSpeech: "Waiting for speech...",
                valEvaluating: "Evaluating...", valNoSummary: "No sufficient summary yet.",
                valNoFlags: "✔️ No critical red flags detected so far", valDiagWaiting: "Analyzing symptoms...",
                valNoDiag: "No registered differential diagnoses yet", valScribePlaceholder: "Examination notes...",
                valSecretPlaceholder: "Type a secret instruction...", valSecretSent: "✅ Instruction sent!",
                valSecretTimeout: "Type another instruction...", valScribeGenerating: "⏳ Generating SOAP...",
                txtRoutingTitle: "🎯 AI Specialty Routing:", txtRoutingSorting: "Sorting...",
                txtRoutingStatusMatch: "✔️ Currently viewed in your dashboard", txtRoutingStatusMismatch: "⚠️ Alert: Case routed to clinic:",
                txtChiefTitle: "📌 Chief Complaint", txtTimelineTitle: "⏱️ Symptoms Timeline",
                txtFlagsTitle: "🚨 Red Flags Radar", txtSummaryTitle: "📝 AI Clinical Summary",
                txtActionTitle: "💡 Suggested Action", txtDiagTitle: "🎯 Differential Diagnosis",
                txtScribeTitle: "🎙️ Clinical Examination Room Scribe", txtScribeDesc: "Click mic and speak findings...",
                btnScribeMic: "🎙️ Start Scribe Mic", btnScribeSend: "⚡ Merge & Generate Final Report",
                txtSecretTitle: "🕵️‍♂️ Live Assistant Override", btnSecretSend: "⚡ Send Override Now",
                txtArcTitle: "🗄️ Patient EMR Archives", txtArcClose: "❌ Close",
                txtArcThMrn: "MRN", txtArcThPhone: "Phone", txtArcThName: "Patient Name",
                txtArcThAge: "Age", txtArcThTime: "Registration Time", txtArcThChief: "Chief Complaint",
                txtArcThAction: "Actions", txtArcLoading: "Loading archives...", txtArcEmpty: "No archived patients yet.",
                btnViewArchive: "👁️ View Case", alertArchiveLoad: "📋 Successfully loaded patient data!",
                alertScribeDone: "✅ SOAP note archived.", txtQueueTitle: "👥 Live Patient Queue:",
                txtQueueEmpty: "⏳ No active patients...", txtQueueCount: "active cases",
                btnDismiss: "✅ Dismiss Patient", confirmDismiss: "Are you sure you want to dismiss this patient from the queue?"
            },
            ar: {
                btnToggle: "🌐 English", btnArchives: "🗄️ الأرشيف", btnSOAP: "🖨️ تصدير التقرير",
                liveStream: "بث حي ومباشر", optAll: "🏥 كل العيادات", optOrtho: "🦴 عظام",
                optCardio: "❤️ قلب", optNeuro: "🧠 مخ وأعصاب", optInternal: "💊 باطنة", optGeneral: "🩺 طب عام",
                lblPatient: "👤 المريض: ", lblMRN: "🪪 الملف: ", lblPhone: "📱 الهاتف: ", lblAge: "🎂 السن: ",
                lblGender: "⚧ الجنس: ", lblChronic: "💊 مزمن: ", lblAllergies: "⚠️ حساسية: ",
                valWaitingPatient: "جاري الاستقبال...", valWaitingSpeech: "في انتظار التحدث...",
                valEvaluating: "جاري التقييم...", valNoSummary: "لا يوجد ملخص كافٍ.",
                valNoFlags: "✔️ لم يتم رصد علامات خطرة", valDiagWaiting: "جاري التحليل...",
                valNoDiag: "لا توجد تشخيصات مسجلة", valScribePlaceholder: "ملاحظات الكشف هنا...",
                valSecretPlaceholder: "توجيه سريع للـ AI...", valSecretSent: "✅ تم الإرسال!",
                valSecretTimeout: "توجيه آخر...", valScribeGenerating: "⏳ جاري توليد التقرير...",
                txtRoutingTitle: "🎯 التوجيه التلقائي:", txtRoutingSorting: "جاري الفرز...",
                txtRoutingStatusMatch: "✔️ الحالة في لوحتك", txtRoutingStatusMismatch: "⚠️ تنبيه: موجهة لعيادة:",
                txtChiefTitle: "📌 الشكوى الرئيسية", txtTimelineTitle: "⏱️ تطور الأعراض",
                txtFlagsTitle: "🚨 رادار الخطورة", txtSummaryTitle: "📝 الملخص السريري",
                txtActionTitle: "💡 التوصية", txtDiagTitle: "🎯 التشخيصات المبدئية",
                txtScribeTitle: "🎙️ المساعد الصوتي للغرفة", txtScribeDesc: "تحدث لتسجيل الملاحظات...",
                btnScribeMic: "🎙️ استماع الكشف", btnScribeSend: "⚡ دمج وتوليد التقرير",
                txtSecretTitle: "🕵️‍♂️ التوجيه المباشر", btnSecretSend: "⚡ إرسال التوجيه",
                txtArcTitle: "🗄️ أرشيف الحالات", txtArcClose: "❌ إغلاق",
                txtArcThMrn: "رقم الملف", txtArcThPhone: "الهاتف", txtArcThName: "الاسم",
                txtArcThAge: "السن", txtArcThTime: "الوقت", txtArcThChief: "الشكوى",
                txtArcThAction: "إجراءات", txtArcLoading: "جاري التحميل...", txtArcEmpty: "لا توجد حالات مسجلة.",
                btnViewArchive: "👁️ استعراض", alertArchiveLoad: "📋 تم تحميل البيانات!",
                alertScribeDone: "✅ تم توليد تقرير SOAP!", txtQueueTitle: "👥 قائمة الانتظار:",
                txtQueueEmpty: "⏳ لا يوجد مرضى حالياً...", txtQueueCount: "حالات نشطة",
                btnDismiss: "✅ إنهاء الكشف ومسح المريض", confirmDismiss: "هل أنت متأكد من إنهاء حالة هذا المريض ومسحه من القائمة؟"
            }
        };

        function applyLanguage(lang) {
            currentLang = lang;
            const dict = i18n[lang];
            const root = document.getElementById('html-root');
            root.setAttribute('lang', lang === 'en' ? 'en' : 'ar');
            root.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
            document.title = lang === 'en' ? "Triage CDSS - Dashboard" : "لوحة تحكم الطبيب";

            document.getElementById('lang-toggle-btn').innerHTML = dict.btnToggle;
            document.getElementById('open-archives-btn').textContent = dict.btnArchives;
            document.getElementById('export-soap-btn').innerHTML = dict.btnSOAP;
            document.getElementById('txt-live-stream').textContent = dict.liveStream;
            
            document.getElementById('opt-all').textContent = dict.optAll;
            document.getElementById('opt-ortho').textContent = dict.optOrtho;
            document.getElementById('opt-cardio').textContent = dict.optCardio;
            document.getElementById('opt-neuro').textContent = dict.optNeuro;
            document.getElementById('opt-internal').textContent = dict.optInternal;
            document.getElementById('opt-general').textContent = dict.optGeneral;

            document.getElementById('lbl-emr-name').innerHTML = `${dict.lblPatient}<strong id="emr-name">${document.getElementById('emr-name').textContent}</strong>`;
            document.getElementById('lbl-emr-mrn').innerHTML = `${dict.lblMRN}<strong id="emr-mrn">${document.getElementById('emr-mrn').textContent}</strong>`;
            document.getElementById('lbl-emr-phone').innerHTML = `${dict.lblPhone}<strong id="emr-phone">${document.getElementById('emr-phone').textContent}</strong>`;
            document.getElementById('lbl-emr-age').innerHTML = `${dict.lblAge}<strong id="emr-age">${document.getElementById('emr-age').textContent}</strong>`;
            document.getElementById('lbl-emr-gender').innerHTML = `${dict.lblGender}<strong id="emr-gender">${document.getElementById('emr-gender').textContent}</strong>`;
            document.getElementById('lbl-emr-chronic').innerHTML = `${dict.lblChronic}<strong id="emr-chronic" style="color: white;">${document.getElementById('emr-chronic').textContent}</strong>`;
            document.getElementById('lbl-emr-allergies').innerHTML = `${dict.lblAllergies}<strong id="emr-allergies" style="color: white;">${document.getElementById('emr-allergies').textContent}</strong>`;

            dismissBtn.textContent = dict.btnDismiss;

            document.getElementById('txt-scribe-title').textContent = dict.txtScribeTitle;
            document.getElementById('txt-scribe-desc').textContent = dict.txtScribeDesc;
            document.getElementById('scribe-mic-btn').innerHTML = dict.btnScribeMic;
            document.getElementById('scribe-input').placeholder = dict.valScribePlaceholder;
            document.getElementById('send-scribe-btn').textContent = dict.btnScribeSend;

            document.getElementById('txt-secret-title').textContent = dict.txtSecretTitle;
            document.getElementById('secret-input').placeholder = dict.valSecretPlaceholder;
            document.getElementById('send-secret-btn').textContent = dict.btnSecretSend;

            document.getElementById('txt-routing-title').textContent = dict.txtRoutingTitle;
            document.getElementById('txt-chief-title').textContent = dict.txtChiefTitle;
            document.getElementById('txt-timeline-title').textContent = dict.txtTimelineTitle;
            document.getElementById('txt-flags-title').textContent = dict.txtFlagsTitle;
            document.getElementById('txt-summary-title').textContent = dict.txtSummaryTitle;
            document.getElementById('txt-action-title').textContent = dict.txtActionTitle;
            document.getElementById('txt-diag-title').textContent = dict.txtDiagTitle;

            document.getElementById('txt-arc-title').textContent = dict.txtArcTitle;
            document.getElementById('txt-arc-close').textContent = dict.txtArcClose;
            document.getElementById('txt-arc-th-mrn').textContent = dict.txtArcThMrn;
            document.getElementById('txt-arc-th-phone').textContent = dict.txtArcThPhone;
            document.getElementById('txt-arc-th-name').textContent = dict.txtArcThName;
            document.getElementById('txt-arc-th-age').textContent = dict.txtArcThAge;
            document.getElementById('txt-arc-th-time').textContent = dict.txtArcThTime;
            document.getElementById('txt-arc-th-chief').textContent = dict.txtArcThChief;
            document.getElementById('txt-arc-th-action').textContent = dict.txtArcThAction;

            document.getElementById('txt-queue-title').textContent = dict.txtQueueTitle;
            renderPatientQueue(); 

            if (document.getElementById('chief-complaint').textContent === i18n.en.valWaitingPatient || document.getElementById('chief-complaint').textContent === i18n.ar.valWaitingPatient) {
                document.getElementById('chief-complaint').textContent = dict.valWaitingPatient;
                document.getElementById('emr-name').textContent = dict.valWaitingPatient;
            }
            if (document.getElementById('symptoms-timeline').textContent === i18n.en.valWaitingSpeech || document.getElementById('symptoms-timeline').textContent === i18n.ar.valWaitingSpeech) {
                document.getElementById('symptoms-timeline').textContent = dict.valWaitingSpeech;
            }
            if (document.getElementById('suggested-action').textContent === i18n.en.valEvaluating || document.getElementById('suggested-action').textContent === i18n.ar.valEvaluating) {
                document.getElementById('suggested-action').textContent = dict.valEvaluating;
            }
            if (document.getElementById('ai-specialty-badge').textContent === i18n.en.txtRoutingSorting || document.getElementById('ai-specialty-badge').textContent === i18n.ar.txtRoutingSorting) {
                document.getElementById('ai-specialty-badge').textContent = dict.txtRoutingSorting;
            }
            if (document.getElementById('red-flags').innerHTML.includes('✔️')) {
                document.getElementById('red-flags').innerHTML = `<span class="no-flags">${dict.valNoFlags}</span>`;
            }
            if (document.getElementById('differential-list').innerHTML.includes('waiting-state')) {
                document.getElementById('differential-list').innerHTML = `<li class="waiting-state">${dict.valDiagWaiting}</li>`;
            }

            document.getElementById('ai-specialty-badge').textContent = translateSpecialty(currentSpecialty);
            applyClinicFilter();
        }

        document.getElementById('lang-toggle-btn').addEventListener('click', () => { applyLanguage(currentLang === 'en' ? 'ar' : 'en'); });

        function translateSpecialty(spec) {
            const map = currentLang === 'en' ? 
                { 'Orthopedics': '🦴 Orthopedics', 'Cardiology': '❤️ Cardiology', 'Neurology': '🧠 Neurology', 'Internal Medicine': '💊 Internal', 'General Medicine': '🩺 General' } :
                { 'Orthopedics': '🦴 عظام', 'Cardiology': '❤️ قلب', 'Neurology': '🧠 مخ وأعصاب', 'Internal Medicine': '💊 باطنة', 'General Medicine': '🩺 طب عام' };
            return map[spec] || spec;
        }

        applyLanguage('en');

        // 🟢 وظيفة تصفير الشاشة بعد مسح المريض
        function resetDashboardUI() {
            const dict = i18n[currentLang];
            document.getElementById('emr-name').textContent = dict.valWaitingPatient;
            document.getElementById('emr-mrn').textContent = "---";
            document.getElementById('emr-phone').textContent = "---"; 
            document.getElementById('emr-age').textContent = "---";
            document.getElementById('emr-gender').textContent = "---";
            document.getElementById('emr-chronic').textContent = "---";
            document.getElementById('emr-allergies').textContent = "---";
            document.getElementById('chief-complaint').textContent = dict.valWaitingPatient;
            document.getElementById('symptoms-timeline').textContent = dict.valWaitingSpeech;
            document.getElementById('clinical-summary').textContent = dict.valNoSummary;
            document.getElementById('suggested-action').textContent = dict.valEvaluating;
            document.getElementById('red-flags').innerHTML = `<span class="no-flags">${dict.valNoFlags}</span>`;
            document.getElementById('differential-list').innerHTML = `<li class="waiting-state">${dict.valDiagWaiting}</li>`;
            dismissBtn.style.display = 'none';
        }

        // 🟢 المستمع لأمر مسح المريض من السيرفر
        socket.on('remove_patient_from_queue', (data) => {
            if (window.activePatientsMap[data.mrn]) {
                delete window.activePatientsMap[data.mrn];
                if (window.lockedMRN === data.mrn) {
                    window.lockedMRN = null;
                    resetDashboardUI();
                }
                renderPatientQueue();
            }
        });

        // 🟢 لما الدكتور يضغط على زرار المسح
        dismissBtn.addEventListener('click', () => {
            if (!window.lockedMRN) return;
            if (confirm(i18n[currentLang].confirmDismiss)) {
                socket.emit('doctor_dismiss_patient', { mrn: window.lockedMRN });
            }
        });

        // 🟢 المريض خلص المحادثة من شاشته (بناءً على طلبك السابق)
        socket.on('patient_triage_completed_alert', (data) => {
            if (window.activePatientsMap[data.mrn]) {
                window.activePatientsMap[data.mrn].patient_finished = true;
                renderPatientQueue();
            }
        });

        function renderPatientQueue() {
            const queueContainer = document.getElementById('active-patients-queue');
            const countBadge = document.getElementById('queue-count-badge');
            const dict = i18n[currentLang];
            const patientKeys = Object.keys(window.activePatientsMap);
            
            countBadge.textContent = `${patientKeys.length} ${dict.txtQueueCount}`;
            
            if (patientKeys.length === 0) {
                queueContainer.innerHTML = `<span style="color: #64748b; font-size: 0.9rem;">${dict.txtQueueEmpty}</span>`;
                return;
            }

            queueContainer.innerHTML = '';
            patientKeys.forEach(mrn => {
                const pData = window.activePatientsMap[mrn];
                const pName = pData.patient_profile ? pData.patient_profile.name : "Unknown Patient";
                const isSelected = (window.lockedMRN === mrn);
                const hasNewMsg = pData.hasUnreadUpdate;
                const hasRedFlags = pData.red_flags_detected && pData.red_flags_detected.length > 0;
                
                let btnStyle = isSelected ? 'background: #0284c7; color: white; border: 2px solid #0369a1; box-shadow: 0 4px 6px rgba(2,132,199,0.3);' : 'background: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1;';
                let extraClass = hasRedFlags && !isSelected ? "emergency-pulse" : "";

                const btn = document.createElement('button');
                btn.style.cssText = `padding: 8px 15px; border-radius: 10px; font-weight: bold; font-size: 0.9rem; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 6px; white-space: nowrap; font-family: inherit; ${btnStyle}`;
                if (extraClass) btn.classList.add(extraClass);
                
                // لو المريض ضغط "إنهاء" بتظهرله علامة 🏁
                const flagIcon = pData.patient_finished ? '🏁' : '';
                const dotIcon = hasNewMsg && !isSelected ? '<span style="width: 10px; height: 10px; background: #ef4444; border-radius: 50%; display: inline-block; animation: pulse 1s infinite;"></span>' : (hasRedFlags ? '🚨' : '🟢');

                btn.innerHTML = `${dotIcon} <span>${pName} (${mrn}) ${flagIcon}</span>`;

                btn.onclick = () => {
                    window.lockedMRN = mrn;
                    window.activePatientsMap[mrn].hasUnreadUpdate = false;
                    renderPatientQueue();
                    loadPatientToScreen(window.activePatientsMap[mrn]);
                };

                queueContainer.appendChild(btn);
            });
        }

        function loadPatientToScreen(data) {
            updateDashboardUI(data);
            dismissBtn.style.display = 'block'; // نظهر زرار المسح لما الدكتور يختار المريض
        }

        function updateDashboardUI(data) {
            const dict = i18n[currentLang];
            if (data.patient_profile) {
                document.getElementById('emr-name').textContent = data.patient_profile.name || dict.valWaitingPatient;
                document.getElementById('emr-mrn').textContent = data.patient_profile.mrn || "N/A";
                document.getElementById('emr-phone').textContent = data.patient_profile.phone || "---"; 
                document.getElementById('emr-age').textContent = data.patient_profile.age || "---";
                document.getElementById('emr-gender').textContent = data.patient_profile.gender || "---";
                document.getElementById('emr-chronic').textContent = data.patient_profile.chronic_diseases || "---";
                document.getElementById('emr-allergies').textContent = data.patient_profile.allergies || "---";
            }
            document.getElementById('chief-complaint').textContent = data.chief_complaint || "---";
            document.getElementById('symptoms-timeline').textContent = data.symptoms_timeline || "---";
            document.getElementById('clinical-summary').textContent = data.ai_clinical_summary || dict.valNoSummary;
            document.getElementById('suggested-action').textContent = data.suggested_action || "---";

            const flagsContainer = document.getElementById('red-flags');
            flagsContainer.innerHTML = '';
            if (data.red_flags_detected && data.red_flags_detected.length > 0) {
                data.red_flags_detected.forEach(flag => { flagsContainer.innerHTML += `<span class="flag-tag">⚠️ ${flag}</span>`; });
            } else { flagsContainer.innerHTML = `<span class="no-flags">${dict.valNoFlags}</span>`; }

            const diagList = document.getElementById('differential-list');
            diagList.innerHTML = '';
            if (data.differential_diagnosis && data.differential_diagnosis.length > 0) {
                data.differential_diagnosis.forEach(diag => {
                    const probClass = `prob-${diag.probability}`;
                    diagList.innerHTML += `<li class="diag-item"><span class="diag-name">🔹 ${diag.condition}</span><span class="prob-badge ${probClass}">Probability: ${diag.probability}</span></li>`;
                });
            } else { diagList.innerHTML = `<li class="waiting-state">${dict.valNoDiag}</li>`; }

            currentSpecialty = data.recommended_specialty || "General Medicine";
            document.getElementById('ai-specialty-badge').textContent = translateSpecialty(currentSpecialty);
            applyClinicFilter();
        }

        function handleIncomingTriageData(data) {
            const mrn = data.patient_profile?.mrn || "MRN-UNKNOWN";
            const isNewPatient = !window.activePatientsMap[mrn];
            window.activePatientsMap[mrn] = data;

            if (isNewPatient) { notificationSound.play().catch(e => console.log("Audio play prevented")); }

            if (!window.lockedMRN || window.lockedMRN === mrn) {
                window.lockedMRN = mrn;
                window.activePatientsMap[mrn].hasUnreadUpdate = false;
                loadPatientToScreen(data);
            } else {
                window.activePatientsMap[mrn].hasUnreadUpdate = true;
            }
            renderPatientQueue();
        }

        socket.on('doctor_dashboard_update', (data) => { handleIncomingTriageData(data); });
        socket.on('clinic_room_update', (data) => { handleIncomingTriageData(data); });

        socket.on('doctor_patient_profile_update', (profile) => {
            if (!window.activePatientsMap[profile.mrn]) {
                window.activePatientsMap[profile.mrn] = { patient_profile: profile };
                notificationSound.play().catch(e => console.log("Audio alert blocked"));
            }
            if (!window.lockedMRN) {
                window.lockedMRN = profile.mrn;
                loadPatientToScreen(window.activePatientsMap[profile.mrn]);
            }
            renderPatientQueue();
        });

        socket.on('ambient_scribe_completed', (data) => {
            handleIncomingTriageData(data);
            alert(i18n[currentLang].alertScribeDone);
        });

        document.getElementById('open-archives-btn').addEventListener('click', () => {
            socket.emit('fetch_patient_archives');
            document.getElementById('archives-modal').style.display = 'flex';
        });

        socket.on('archives_data_reply', (archives) => {
            const dict = i18n[currentLang];
            const tbody = document.getElementById('archives-table-body');
            tbody.innerHTML = '';
            if (archives && archives.length > 0) {
                archives.forEach((rec, index) => {
                    const chief = rec.triage_data ? rec.triage_data.chief_complaint : "N/A";
                    tbody.innerHTML += `<tr><td><strong style="color: #0284c7;">${rec.mrn}</strong></td><td>${rec.phone || 'N/A'}</td><td>${rec.name}</td><td>${rec.age}</td><td>${rec.timestamp}</td><td>${chief}</td><td><button class="btn-view-archive" onclick="loadArchiveToDashboard(${index})">${dict.btnViewArchive}</button></td></tr>`;
                });
                window.cachedArchives = archives;
            } else { tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">${dict.txtArcEmpty}</td></tr>`; }
        });

        window.loadArchiveToDashboard = function(index) {
            const archiveRec = window.cachedArchives[index];
            if (archiveRec && archiveRec.triage_data) {
                handleIncomingTriageData({ ...archiveRec.triage_data, patient_profile: { mrn: archiveRec.mrn, phone: archiveRec.phone, name: archiveRec.name, age: archiveRec.age } });
                document.getElementById('archives-modal').style.display = 'none';
                alert(i18n[currentLang].alertArchiveLoad);
            }
        };

        const scribeMicBtn = document.getElementById('scribe-mic-btn');
        const scribeInput = document.getElementById('scribe-input');
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const scribeRec = new SpeechRecognition();
            scribeRec.lang = 'ar-EG'; scribeRec.continuous = false;
            scribeMicBtn.addEventListener('click', () => { scribeRec.start(); scribeMicBtn.style.background = "#ef4444"; scribeMicBtn.innerHTML = "🎧 Listening..."; });
            scribeRec.onresult = (event) => { scribeInput.value += " " + event.results[0][0].transcript; scribeMicBtn.style.background = "#f59e0b"; scribeMicBtn.innerHTML = i18n[currentLang].btnScribeMic; };
            scribeRec.onerror = () => { scribeMicBtn.style.background = "#f59e0b"; scribeMicBtn.innerHTML = i18n[currentLang].btnScribeMic; };
        } else { scribeMicBtn.style.display = 'none'; }

        document.getElementById('send-scribe-btn').addEventListener('click', () => {
            const notes = scribeInput.value.trim();
            if (!notes) return;
            scribeInput.value = i18n[currentLang].valScribeGenerating;
            socket.emit('doctor_ambient_scribe', { doctor_notes: notes, current_mrn: window.lockedMRN });
            setTimeout(() => { scribeInput.value = ""; }, 4000);
        });

        const secretInput = document.getElementById('secret-input');
        function sendSecretInstruction() {
            const text = secretInput.value.trim();
            if (!text) return;
            socket.emit('doctor_secret_instruction', { instruction: text });
            secretInput.value = ''; secretInput.placeholder = i18n[currentLang].valSecretSent;
            setTimeout(() => { secretInput.placeholder = i18n[currentLang].valSecretTimeout; }, 3000);
        }
        document.getElementById('send-secret-btn').addEventListener('click', sendSecretInstruction);
        secretInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendSecretInstruction(); });

        function applyClinicFilter() {
            const selectedClinic = clinicFilter.value;
            const dict = i18n[currentLang];
            if (selectedClinic === "All" || selectedClinic === currentSpecialty) {
                document.getElementById('dashboard-content').style.opacity = "1";
                routingCard.style.background = "#fdf4ff"; routingCard.style.borderColor = "#d8b4fe";
                routingStatus.textContent = dict.txtRoutingStatusMatch; routingStatus.style.color = "#16a34a";
            } else {
                document.getElementById('dashboard-content').style.opacity = "0.4";
                routingCard.style.background = "#fee2e2"; routingCard.style.borderColor = "#fca5a5";
                routingStatus.textContent = `${dict.txtRoutingStatusMismatch} (${translateSpecialty(currentSpecialty)})`;
                routingStatus.style.color = "#dc2626";
            }
        }
        clinicFilter.addEventListener('change', () => { if (clinicFilter.value !== "All") socket.emit('join_clinic_room', clinicFilter.value); applyClinicFilter(); });

        document.getElementById('export-soap-btn').addEventListener('click', () => {
            const isEn = currentLang === 'en';
            const name = document.getElementById('emr-name').textContent; const mrn = document.getElementById('emr-mrn').textContent;
            const phone = document.getElementById('emr-phone').textContent; const age = document.getElementById('emr-age').textContent;
            const chronic = document.getElementById('emr-chronic').textContent; const allergies = document.getElementById('emr-allergies').textContent;
            const chief = document.getElementById('chief-complaint').textContent; const timeline = document.getElementById('symptoms-timeline').textContent;
            const summary = document.getElementById('clinical-summary').textContent; const action = document.getElementById('suggested-action').textContent;
            
            let diffDiagHtml = "";
            const diagItems = document.querySelectorAll('#differential-list .diag-item');
            if (diagItems.length > 0 && !document.querySelector('#differential-list .waiting-state')) {
                diagItems.forEach(item => { diffDiagHtml += `<li>${item.innerText}</li>`; });
            } else { diffDiagHtml = `<li>${isEn ? 'No differential diagnosis recorded' : 'لا توجد تشخيصات'}</li>`; }

            let redFlagsHtml = "";
            const flags = document.querySelectorAll('#red-flags .flag-tag');
            if (flags.length > 0) { flags.forEach(flag => { redFlagsHtml += `<li>${flag.innerText}</li>`; }); } 
            else { redFlagsHtml = `<li>${isEn ? '✔️ No critical red flags' : '✔️ لا توجد علامات خطورة'}</li>`; }

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html dir="${isEn ? 'ltr' : 'rtl'}"><head><title>SOAP Note - ${mrn}</title><style>
                    body { font-family: 'Tahoma', sans-serif; padding: 40px; line-height: 1.8; }
                    .header { text-align: center; border-bottom: 3px double #0284c7; padding-bottom: 15px; margin-bottom: 25px; }
                    .patient-box { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 25px; display: flex; justify-content: space-between; flex-wrap: wrap; }
                    .section { margin-bottom: 20px; background: #f8fafc; padding: 15px; border-${isEn ? 'left' : 'right'}: 5px solid #0284c7; border-radius: 8px; }
                    .section-title { font-weight: bold; font-size: 1.1rem; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
                    .footer { margin-top: 50px; display: flex; justify-content: space-between; font-weight: bold; }
                </style></head><body>
                    <div class="header"><h2>🏥 Smart Triage EMR</h2><p>${isEn ? 'Date:' : 'التاريخ:'} ${new Date().toLocaleString()}</p></div>
                    <div class="patient-box">
                        <div><b>Name:</b> ${name}</div><div><b>MRN:</b> ${mrn}</div><div><b>Age:</b> ${age}</div>
                        <div><b>Chronic:</b> ${chronic}</div><div><b>Allergies:</b> ${allergies}</div>
                    </div>
                    <div class="section"><div class="section-title">[S] Subjective</div><p><b>Complaint:</b> ${chief}</p><p><b>Timeline:</b> ${timeline}</p></div>
                    <div class="section"><div class="section-title">[O] Objective & Flags</div><ul>${redFlagsHtml}</ul></div>
                    <div class="section"><div class="section-title">[A] Assessment</div><p><b>Summary:</b><br>${summary}</p><p><b>Specialty:</b> ${translateSpecialty(currentSpecialty)}</p><ul>${diffDiagHtml}</ul></div>
                    <div class="section"><div class="section-title">[P] Plan</div><p><b>Next Steps:</b> ${action}</p></div>
                    <div class="footer"><div>Date: ........................</div><div>Signature: ........................</div></div>
                    <script>window.onload = function() { window.print(); };<\/script>
                </body></html>
            `);
            printWindow.document.close();
        });
    </script>
</body>
</html>
