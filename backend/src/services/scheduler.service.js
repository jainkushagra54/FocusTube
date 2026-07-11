/**
 * Scheduler Service to calculate study calendars for FocusTube courses.
 */

/**
 * Generates a schedule mapping videos to specific calendar dates.
 * 
 * Scenario A: Fit in Date Range (If targetEndDate is provided)
 *   Spread videos as evenly as possible across the available days.
 * 
 * Scenario B: Daily Target Load (If videosPerDay is specified, and targetEndDate is omitted or calculated)
 *   Assign a set amount of videos daily, extending the calendar as long as needed.
 * 
 * @param {Array} videos - Array of video objects containing youtubeId
 * @param {Date|String} startDate - Date to start learning
 * @param {Date|String} targetEndDate - Requested completion date (optional)
 * @param {Number} videosPerDay - Target videos to watch per day (optional, defaults to 1)
 * @returns {Object} { schedule: Array, calculatedEndDate: Date }
 */
export const calculateSchedule = (videos, startDate, targetEndDate = null, videosPerDay = 1) => {
  if (!videos || videos.length === 0) {
    return { schedule: [], calculatedEndDate: new Date(startDate) };
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const schedule = [];
  let calculatedEndDate = new Date(start);

  if (targetEndDate) {
    const end = new Date(targetEndDate);
    end.setHours(0, 0, 0, 0);

    // Calculate difference in days (inclusive)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const daysAvailable = diffDays > 0 ? diffDays : 1;
    const totalVideos = videos.length;

    // Calculate base videos per day and the remainder
    const baseVideosPerDay = Math.floor(totalVideos / daysAvailable);
    let remainder = totalVideos % daysAvailable;

    let videoIndex = 0;

    for (let day = 0; day < daysAvailable; day++) {
      if (videoIndex >= totalVideos) break;

      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + day);

      // Distribute the remainder across the first few days
      const countForToday = baseVideosPerDay + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      const todaysVideos = [];
      for (let i = 0; i < countForToday; i++) {
        if (videoIndex < totalVideos) {
          todaysVideos.push(videos[videoIndex].youtubeId);
          videoIndex++;
        }
      }

      if (todaysVideos.length > 0) {
        schedule.push({
          date: currentDate,
          videoYoutubeIds: todaysVideos
        });
        calculatedEndDate = currentDate;
      }
    }
  } else {
    // Rely strictly on videosPerDay to generate dates
    const totalVideos = videos.length;
    let videoIndex = 0;
    let dayOffset = 0;

    while (videoIndex < totalVideos) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + dayOffset);

      const todaysVideos = [];
      for (let i = 0; i < videosPerDay; i++) {
        if (videoIndex < totalVideos) {
          todaysVideos.push(videos[videoIndex].youtubeId);
          videoIndex++;
        }
      }

      schedule.push({
        date: currentDate,
        videoYoutubeIds: todaysVideos
      });
      calculatedEndDate = currentDate;
      dayOffset++;
    }
  }

  return {
    schedule,
    calculatedEndDate
  };
};
