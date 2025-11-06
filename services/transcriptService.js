function extractVideoId(url) {
  if (!url) return null;
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

async function fetchTimedTextFallback(videoId, langs = ['en', 'en-US', 'en-GB']) {
  // try multiple language codes and both uploaded and ASR types
  const tries = [];
  for (const lang of langs) {
    tries.push(`https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}`);
    tries.push(`https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&type=asr`);
  }

  for (const url of tries) {
    try {
      const resp = await axios.get(url, { timeout: 8000 });
      if (!resp.data) continue;
      // quick check for empty transcript XML
      if (typeof resp.data === 'string' && resp.data.trim().length < 20) continue;

      // parse XML
      const parsed = await parseStringPromise(resp.data, { explicitArray: false, trim: true });
      if (!parsed || !parsed.transcript || !parsed.transcript.text) continue;

      const texts = Array.isArray(parsed.transcript.text)
        ? parsed.transcript.text
        : [parsed.transcript.text];

      // sometimes the ._ property has the text, sometimes the value itself
      const transcript = texts.map(t => (t._ || t.$?.text || t)).map(s => (typeof s === 'object' ? '' : s)).join(' ').replace(/\s+/g, ' ').trim();

      if (transcript && transcript.length > 0) {
        return { videoId, transcript, transcriptSegments: texts.length, rawSource: url };
      }
    } catch (err) {
      // don't fail on single fallback error, just try next
      console.warn('[timedtext] fetch failed for', url, err && err.message ? err.message : err);
    }
  }

  return null;
}

const fetchTranscript = async (videoUrl) => {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL / videoId not found');
  }

  // try your library first (best case)
  try {
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
    console.log('[transcriptService] library transcriptData length:', Array.isArray(transcriptData) ? transcriptData.length : 'unknown');
    if (transcriptData && transcriptData.length > 0) {
      const transcript = transcriptData.map(item => item.text).join(' ').replace(/\s+/g, ' ').trim();
      return { videoId, url: videoUrl, transcript, transcriptSegments: transcriptData.length, source: 'library' };
    }
  } catch (libErr) {
    console.warn('[transcriptService] library fetch failed:', libErr && libErr.message ? libErr.message : libErr);
    // continue to fallback
  }

  // fallback: timedtext endpoint (uploaded captions and ASR)
  const timed = await fetchTimedTextFallback(videoId, ['en', 'en-US', 'en-GB']);
  if (timed) {
    console.log('[transcriptService] timedtext fallback used:', timed.rawSource);
    return { videoId, url: videoUrl, transcript: timed.transcript, transcriptSegments: timed.transcriptSegments, source: 'timedtext' };
  }

  // as last resort, try other languages? you can extend above to check video owner languages
  throw new Error('No transcript available for this video');
};

module.exports = { extractVideoId, fetchTranscript };