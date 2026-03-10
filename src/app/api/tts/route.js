const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'XrExE9yKIg1WjnnlVkGX'; // Matilde — warm Spanish female

async function generateSpeech(text) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.78,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('ElevenLabs TTS error:', res.status, err);
    return Response.json({ error: 'TTS failed' }, { status: 502 });
  }

  return new Response(res.body, {
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

// POST endpoint for sentence-level streaming TTS
export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) return Response.json({ error: 'Missing text' }, { status: 400 });
    return generateSpeech(text);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
