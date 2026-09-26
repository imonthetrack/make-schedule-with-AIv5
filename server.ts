import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `You are an expert AI Full-Stack Developer & Behavioral System Designer for the PWA productivity app "Make Schedule with AI" for the YCWC 2026 competition.
CRITICAL RULES:
1. APP NAME: Strictly retain "Make Schedule with AI".
2. LANGUAGE: All output text, micro-steps, and counseling responses MUST be in Bahasa Indonesia.
3. APP PHILOSOPHY: "Life-OS & Behavioral Compass"—a habit-building system designed to lower execution friction, prevent procrastination/burnout, and guide users toward consistent life improvement in all aspects.
4. TARGET PERSONA: High school students and active users preparing for competitions (OSN, SNBT, TKA) who struggle with manual schedule writing, paper waste, time inefficiency, fatigue, and lack of motivation.

==================================================
1. MICRO-STEP AI (PROACTIVE TASK DECOMPOSITION)
==================================================
- Purpose: Overcome mental friction when facing heavy/intimidating tasks.
- Logic: When a user enters a task (e.g., "Kerjakan 10 Soal Matematika OSN"), decompose it into EXACTLY 3 bite-sized, actionable micro-steps.
- Execution: Steps must be doable in the first 1-2 minutes to trick the brain into starting.
- Output Format: Clean JSON Array of 3 strings.
  Example: ["Buka buku atau modul latihan hal 15", "Pilih 1 soal paling sederhana", "Tuliskan diketahui & ditanya"]

==================================================
2. BEHAVIORAL COUNSELING AI (UNBLOCKER COACH & END-OF-DAY CHECK-IN)
==================================================
- Purpose: Provide empathetic counseling and friction analysis without guilt-tripping the user.
- Integration & Flow: Conducted as a non-intrusive summary check-in at the end of a session or end of the day, or when a task is marked "Belum Selesai" or skipped.
- Logic: Identifies psychological blockers (kelelahan/fatigue, perfeksionisme/perfectionism, distraksi/distraction, kurang motivasi/lack of motivation) and responds with:
  1. empathy_message: A 1-sentence empathetic statement.
  2. recovery_action: A 1-minute micro-recovery action.
- Output Format: JSON Object with keys "empathy_message", "recovery_action", "blocker_type", and "suggested_shift_minutes".`;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Make Schedule with AI', time: new Date().toISOString() });
});

// Helper for local heuristic fallback when offline or in exhibition hall
function getFallbackMicroSteps(taskTitle: string): string[] {
  const lower = taskTitle.toLowerCase();
  if (lower.includes('matematika') || lower.includes('osn') || lower.includes('soal') || lower.includes('snbt') || lower.includes('tka')) {
    return [
      'Buka buku modul latihan atau lembar soal di mejamu.',
      'Pilih 1 nomor soal yang paling sederhana dan ramah.',
      'Tuliskan hal yang diketahui dan ditanya di kertas coretan.'
    ];
  }
  if (lower.includes('biola') || lower.includes('musik') || lower.includes('gitar') || lower.includes('lagu')) {
    return [
      'Buka hardcase atau tempat instrumen musikmu di meja.',
      'Pegang instrumen 30 detik untuk merasakan kenyamanan jari.',
      'Coba mainkan 1 nada atau petikan pembuka tanpa target selesai.'
    ];
  }
  if (lower.includes('skripsi') || lower.includes('tugas') || lower.includes('makalah') || lower.includes('esai') || lower.includes('laporan')) {
    return [
      'Buka laptop atau dokumen lembar kerja di layar.',
      'Tuliskan 1 judul bab atau poin gagasan yang ingin dibahas.',
      'Ketik 1 kalimat pertama apa adanya tanpa menghakimi tulisan.'
    ];
  }
  if (lower.includes('kamar') || lower.includes('bersih') || lower.includes('meja')) {
    return [
      'Berdiri dan ambil 1 barang terdekat yang tidak pada tempatnya.',
      'Kembalikan barang tersebut ke laci atau tempat semula.',
      'Rapikan 1 sudut meja saja selama 60 detik.'
    ];
  }
  return [
    `Siapkan peralatan atau perlengkapan untuk "${taskTitle}" di atas meja.`,
    'Tentukan 1 bagian awal yang paling ringan tanpa memikirkan selesainya.',
    'Mulai lakukan gerakan pertama selama 60 detik tanpa beban.'
  ];
}

function getFallbackCounseling(reason: string): {
  empathy_message: string;
  recovery_action: string;
  blocker_type: string;
  suggested_shift_minutes: number;
} {
  const lower = reason.toLowerCase();
  if (lower.includes('pusing') || lower.includes('capek') || lower.includes('lelah') || lower.includes('ngantuk')) {
    return {
      empathy_message: 'Tubuhmu sedang memberikan sinyal wajar bahwa energi mentalmu terkuras setelah seharian beraktivitas.',
      recovery_action: 'Pejamkan mata sejenak, minum segelas air putih dingin, dan tarik napas dalam 4 hitungan.',
      blocker_type: 'fatigue',
      suggested_shift_minutes: 20
    };
  }
  if (lower.includes('susah') || lower.includes('sempurna') || lower.includes('salah') || lower.includes('gagal') || lower.includes('buntu')) {
    return {
      empathy_message: 'Rasa cemas ini sering muncul karena standar tinggimu, bukan karena kamu tidak mampu menghadapinya.',
      recovery_action: 'Tuliskan coretan kasar seadanya di kertas buram tanpa perlu terlihat rapi sama sekali.',
      blocker_type: 'perfectionism',
      suggested_shift_minutes: 15
    };
  }
  if (lower.includes('hp') || lower.includes('scrolling') || lower.includes('distraksi') || lower.includes('medsos')) {
    return {
      empathy_message: 'Wajar teralihkan saat otak mencari dopamin cepat di tengah tugas yang terasa menumpuk.',
      recovery_action: 'Balikkan layar HP menghadap ke bawah dan letakkan 2 meter dari jangkauan tanganmu.',
      blocker_type: 'distraction',
      suggested_shift_minutes: 15
    };
  }
  return {
    empathy_message: 'Sangat manusiawi untuk merasa tertahan saat menghadapi target berat di luar zona nyaman.',
    recovery_action: 'Berdiri, regangkan bahu dan leher selama 1 menit, lalu mulai dari langkah paling santai.',
    blocker_type: 'motivation',
    suggested_shift_minutes: 15
  };
}

// 1. FUNGSI 1: AI MICRO-STEP NOTIFIER Endpoint (Exactly 3 bite-sized steps)
app.post('/api/ai/micro-step', async (req, res) => {
  const { taskTitle } = req.body;
  if (!taskTitle || typeof taskTitle !== 'string') {
    res.status(400).json({ error: 'taskTitle is required' });
    return;
  }

  try {
    const ai = getAi();
    const prompt = `Tugas: "${taskTitle}"
Pecah tugas ini menjadi TEPAT 3 LANGKAH MIKROSKOPIS (Micro-Steps) pertama yang sangat ringan, terukur, dan dapat dilakukan dalam 1-2 menit pertama untuk menghilangkan rasa malas.
Gunakan Bahasa Indonesia.
Keluarkan HANYA format JSON valid berupa Array 3 string:
["langkah 1", "langkah 2", "langkah 3"]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    const outputText = response.text?.trim() || '';
    let steps: string[] = [];
    try {
      const parsed = JSON.parse(outputText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        steps = parsed.slice(0, 3).map((s: any) => String(s).trim());
      }
    } catch {
      // JSON parse fallback
    }

    if (steps.length === 0) {
      steps = getFallbackMicroSteps(taskTitle);
    }

    res.json({
      microSteps: steps,
      microStep: steps[0] || 'Siapkan peralatan pertama di atas meja.',
    });
  } catch (error: any) {
    console.warn('Micro-step generation fallback used:', error?.message);
    const fallback = getFallbackMicroSteps(taskTitle);
    res.json({
      microSteps: fallback,
      microStep: fallback[0],
    });
  }
});

// 2. FUNGSI 2: BEHAVIORAL COUNSELING AI & DYNAMIC EVALUATOR Endpoint
app.post('/api/ai/behavioral-counseling', async (req, res) => {
  const { reason, taskTitle } = req.body;
  if (!reason || typeof reason !== 'string') {
    res.status(400).json({ error: 'reason is required' });
    return;
  }

  try {
    const ai = getAi();
    const taskContext = taskTitle ? ` (Terkait kegiatan: "${taskTitle}")` : '';
    const prompt = `Konteks Keluhan / Alasan Menunda${taskContext}: "${reason}"
Berikan konseling perilaku yang ramah tanpa rasa bersalah.
Analisis blocker psikologis (kelelahan / perfeksionisme / distraksi / kurang motivasi).
Balas HANYA dengan JSON valid:
{
  "empathy_message": "1 kalimat empati mendalam yang menenangkan",
  "recovery_action": "1 aksi pemulihan mikro 1 menit untuk merestart fokus",
  "blocker_type": "fatigue" | "perfectionism" | "distraction" | "motivation",
  "suggested_shift_minutes": 15
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const outputText = response.text?.trim() || '';
    try {
      const parsed = JSON.parse(outputText);
      res.json({
        empathy_message: parsed.empathy_message || 'Wajar sekali jika energimu sedang turun saat ini.',
        recovery_action: parsed.recovery_action || 'Ambil jeda napas dalam 1 menit dan minum segelas air hangat.',
        blocker_type: parsed.blocker_type || 'general',
        suggested_shift_minutes: Number(parsed.suggested_shift_minutes) || 15,
        response: `${parsed.empathy_message} ${parsed.recovery_action}`,
        suggestedShiftMinutes: Number(parsed.suggested_shift_minutes) || 15,
      });
      return;
    } catch {
      // Fallback
    }

    const fallback = getFallbackCounseling(reason);
    res.json({
      ...fallback,
      response: `${fallback.empathy_message} ${fallback.recovery_action}`,
      suggestedShiftMinutes: fallback.suggested_shift_minutes,
    });
  } catch (error: any) {
    console.warn('Counseling fallback used:', error?.message);
    const fallback = getFallbackCounseling(reason);
    res.json({
      ...fallback,
      response: `${fallback.empathy_message} ${fallback.recovery_action}`,
      suggestedShiftMinutes: fallback.suggested_shift_minutes,
    });
  }
});

// Legacy alias for /api/ai/dynamic-evaluator
app.post('/api/ai/dynamic-evaluator', async (req, res) => {
  const { reason, taskTitle } = req.body;
  const fallback = getFallbackCounseling(reason || '');
  try {
    const ai = getAi();
    const taskContext = taskTitle ? ` (Terkait tugas: "${taskTitle}")` : '';
    const prompt = `[BEHAVIORAL COUNSELING AI]\nAlasan/Keluhan Pengguna${taskContext}: "${reason}"\nBerikan 1 kalimat empati + 1 aksi pemulihan mikro 1 menit + saran reschedule (15, 30, atau 45 menit):`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const outputText = response.text?.trim() || `${fallback.empathy_message} ${fallback.recovery_action}`;
    let suggestedShiftMinutes = 15;
    const match = outputText.match(/(\d+)\s*(?:menit|mnt)/i);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (parsed > 0 && parsed <= 180) suggestedShiftMinutes = parsed;
    }

    res.json({
      response: outputText,
      suggestedShiftMinutes,
      empathy_message: fallback.empathy_message,
      recovery_action: fallback.recovery_action,
    });
  } catch {
    res.json({
      response: `${fallback.empathy_message} ${fallback.recovery_action}`,
      suggestedShiftMinutes: fallback.suggested_shift_minutes,
      empathy_message: fallback.empathy_message,
      recovery_action: fallback.recovery_action,
    });
  }
});

// 3. UNIFIED ASSISTANT: Auto-Detect Function or Manual Mode
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { input, mode } = req.body;
    if (!input || typeof input !== 'string') {
      res.status(400).json({ error: 'input is required' });
      return;
    }

    const ai = getAi();
    let prompt = '';
    if (mode === 'micro_step') {
      prompt = `[FUNGSI 1: AI MICRO-STEP NOTIFIER]\nTugas: "${input}"\nBerikan 1-2 kalimat aksi fisik pertama yang paling ringan:`;
    } else if (mode === 'dynamic_evaluator') {
      prompt = `[FUNGSI 2: AI DYNAMIC EVALUATOR]\nAlasan kegagalan/penundaan: "${input}"\nBerikan respon empati + solusi reschedule dalam 2-3 kalimat:`;
    } else {
      prompt = `Kenali apakah input berikut berupa NAMA TUGAS (jalankan FUNGSI 1: AI Micro-Step Notifier) atau ALASAN KEGAGALAN/PENUNDAAN (jalankan FUNGSI 2: AI Dynamic Evaluator).\nInput: "${input}"\nBerikan respon langsung sesuai fungsi tersebut:`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const outputText = response.text?.trim() || '';
    let suggestedShiftMinutes = 15;
    const match = outputText.match(/(\d+)\s*(?:menit|mnt)/i);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (parsed > 0 && parsed <= 180) suggestedShiftMinutes = parsed;
    }

    res.json({
      output: outputText,
      suggestedShiftMinutes,
    });
  } catch (error: any) {
    console.error('Error in AI assistant:', error);
    res.json({
      output: `Istirahat dulu sejenak ya. Coba mulai dari langkah paling santai saat kamu siap.`,
      suggestedShiftMinutes: 15,
    });
  }
});

// Setup Vite middleware for development or Static Serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Rest Guard Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
