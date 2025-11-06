// filepath: d:\programmes1\web devlopment\EduNotes\services\transcriptService.js
export const isValidYouTubeUrl = (url) => {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
  return regex.test(url);
};

export const extractVideoId = (url) => {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&\n]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const fetchTranscript = async (videoUrl) => {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) throw new Error('Invalid video ID');

  // Simulate fetching transcript from an external service
  // Replace this with actual API call to fetch transcript
  const mockTranscripts = {
    'dQw4w9WgXcQ': 'This is a mock transcript for the video.',
  };

  if (!mockTranscripts[videoId]) {
    throw new Error('No transcript available for this video');
  }

  return {
    videoId,
    transcript: mockTranscripts[videoId],
  };
};