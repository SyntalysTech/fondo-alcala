import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET endpoint so browser can use native audio streaming via <audio src="url">
export async function GET(req) {
  try {
    const text = new URL(req.url).searchParams.get('text');
    if (!text) return Response.json({ error: 'Missing text' }, { status: 400 });

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
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
