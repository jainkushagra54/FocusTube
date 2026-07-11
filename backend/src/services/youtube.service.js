import axios from 'axios';
import AppError from '../utils/AppError.js';

/**
 * Extracts YouTube Video ID or Playlist ID from a URL.
 * Returns { id, type } where type is 'single' or 'playlist'.
 */
export const parseYoutubeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    throw new AppError('Invalid URL provided', 400);
  }

  // Check for Playlist ID first
  const playlistRegex = /[&?]list=([^&]+)/;
  const playlistMatch = url.match(playlistRegex);
  
  if (playlistMatch) {
    return { id: playlistMatch[1], type: 'playlist' };
  }

  if (url.includes('youtube.com/playlist')) {
    const listRegex = /list=([^&]+)/;
    const match = url.match(listRegex);
    if (match) return { id: match[1], type: 'playlist' };
  }

  // Check for Video ID
  // Handles: watch?v=ID, youtu.be/ID, embed/ID, v/ID, matches 11 char alphanumeric/hyphen/underscore
  const videoRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
  const videoMatch = url.match(videoRegex);

  if (videoMatch) {
    return { id: videoMatch[1], type: 'single' };
  }

  // If it's a raw 11 character string or playlist ID string
  if (url.length === 11) {
    return { id: url, type: 'single' };
  }
  if (url.startsWith('PL') && url.length >= 18) {
    return { id: url, type: 'playlist' };
  }

  throw new AppError('Could not parse a valid YouTube Video or Playlist ID from the URL', 400);
};

/**
 * Helper to convert ISO 8601 duration (e.g. PT1H2M10S) to seconds.
 */
const parseISO8601Duration = (durationStr) => {
  if (!durationStr) return 0;
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = durationStr.match(regex);
  if (!matches) return 0;
  
  const hours = parseInt(matches[1] || 0, 10);
  const minutes = parseInt(matches[2] || 0, 10);
  const seconds = parseInt(matches[3] || 0, 10);
  
  return (hours * 3600) + (minutes * 60) + seconds;
};

/**
 * Fallback Mock Data Generator when YouTube API Key is missing.
 */
const generateMockPlaylist = (playlistId) => {
  console.warn('⚠️ FocusTube: YOUTUBE_API_KEY is not defined. Using mock playlist parser.');
  
  const courseTitle = `Imported Course (Mock Playlist: ${playlistId.substring(0, 6)})`;
  const videos = [];
  
  // Create 8 mock videos for testing
  const videoTitles = [
    '01. Introduction and Setup',
    '02. Core Architecture and Patterns',
    '03. Building the Database Schemas',
    '04. Establishing Router and Middleware layers',
    '05. Creating User Authentication Flow',
    '06. Integration with External APIs',
    '07. Advanced Design and Scalability Optimizations',
    '08. Summary, Review, and Next Steps'
  ];

  for (let i = 0; i < videoTitles.length; i++) {
    videos.push({
      title: videoTitles[i],
      youtubeId: `mock_vid_id_${i + 1}`,
      description: `In this lecture, we cover the topic of ${videoTitles[i].toLowerCase()}. This is mock metadata for testing when the YouTube Data API key is not configured.`,
      duration: 600 + (i * 120), // 10 mins, 12 mins, etc.
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
      position: i
    });
  }

  return {
    title: courseTitle,
    description: 'This is a mock course import created because YOUTUBE_API_KEY is not set. Get an API key from Google Cloud Console to import real playlist structures.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
    youtubeId: playlistId,
    type: 'playlist',
    videos
  };
};

const generateMockVideo = (videoId) => {
  console.warn('⚠️ FocusTube: YOUTUBE_API_KEY is not defined. Using mock video parser.');
  
  return {
    title: `Imported Video (Mock Video: ${videoId})`,
    description: 'This is a mock course import created because YOUTUBE_API_KEY is not set. Get an API key from Google Cloud Console to import real video structures.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=600&auto=format&fit=crop',
    youtubeId: videoId,
    type: 'single',
    videos: [
      {
        title: `Single Video Lecture (${videoId})`,
        youtubeId: videoId,
        description: 'Single video course lecture description.',
        duration: 1800, // 30 minutes
        thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=300&auto=format&fit=crop',
        position: 0
      }
    ]
  };
};

/**
 * Fetch course details from YouTube (or mock fallback).
 */
export const fetchYoutubeCourseData = async (youtubeId, type) => {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    if (type === 'playlist') {
      return generateMockPlaylist(youtubeId);
    } else {
      return generateMockVideo(youtubeId);
    }
  }

  try {
    if (type === 'single') {
      // 1. Fetch Single Video Info
      const videoRes = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${youtubeId}&key=${apiKey}`
      );

      if (!videoRes.data.items || videoRes.data.items.length === 0) {
        throw new AppError('YouTube video not found', 404);
      }

      const item = videoRes.data.items[0];
      const durationSeconds = parseISO8601Duration(item.contentDetails?.duration);

      return {
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
        youtubeId,
        type: 'single',
        videos: [
          {
            title: item.snippet.title,
            youtubeId,
            description: item.snippet.description,
            duration: durationSeconds,
            thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
            position: 0
          }
        ]
      };
    } else {
      // 2. Fetch Playlist Details (Title & Metadata)
      const playlistRes = await axios.get(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${youtubeId}&key=${apiKey}`
      );

      if (!playlistRes.data.items || playlistRes.data.items.length === 0) {
        throw new AppError('YouTube playlist not found', 404);
      }

      const playlistInfo = playlistRes.data.items[0].snippet;

      // 3. Fetch Playlist Items (Videos list - Fetch up to 100 items using pagination)
      const videos = [];
      let nextPageToken = '';
      let pageCount = 0;
      const maxPages = 2; // Up to 100 videos

      do {
        const itemsRes = await axios.get(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${youtubeId}&maxResults=50&pageToken=${nextPageToken}&key=${apiKey}`
        );

        const items = itemsRes.data.items || [];
        
        // Collect video IDs to fetch duration details
        const videoIds = items.map(item => item.contentDetails?.videoId).filter(Boolean);

        let durationMap = {};
        if (videoIds.length > 0) {
          const detailRes = await axios.get(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(',')}&key=${apiKey}`
          );
          (detailRes.data.items || []).forEach(vid => {
            durationMap[vid.id] = parseISO8601Duration(vid.contentDetails?.duration);
          });
        }

        // Add videos to the array
        items.forEach((item, index) => {
          const vidId = item.contentDetails?.videoId;
          if (!vidId) return;

          videos.push({
            title: item.snippet.title,
            youtubeId: vidId,
            description: item.snippet.description || '',
            duration: durationMap[vidId] || 0,
            thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
            position: videos.length // Keep cumulative index
          });
        });

        nextPageToken = itemsRes.data.nextPageToken || '';
        pageCount++;
      } while (nextPageToken && pageCount < maxPages);

      return {
        title: playlistInfo.title,
        description: playlistInfo.description || '',
        thumbnailUrl: playlistInfo.thumbnails?.high?.url || playlistInfo.thumbnails?.default?.url || '',
        youtubeId,
        type: 'playlist',
        videos
      };
    }
  } catch (error) {
    if (error.statusCode) throw error;
    console.error('YouTube API Error:', error.response?.data || error.message);
    throw new AppError('Failed to fetch data from YouTube API. Please verify your API key or connection.', 502);
  }
};
