import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateSpeech(text) {
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text,
    speed: 1.12,
    response_format: 'mp3',
  });
  return new Response(mp3.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache',
    },
  });
}

// GET endpoint for simple playback (greeting, etc.)
export async function GET(req) {
  try {
    const text = new URL(req.url).searchParams.get('text');
    if (!text) return Response.json({ error: 'Missing text' }, { status: 400 });
    return generateSpeech(text);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST endpoint for sentence-level streaming TTS (avoids URL length limits)
export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) return Response.json({ error: 'Missing text' }, { status: 400 });
    return generateSpeech(text);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
