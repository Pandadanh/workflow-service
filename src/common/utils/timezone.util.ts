/**
 * Timezone utility functions for handling Vietnam timezone (UTC+7)
 */

/**
 * Converts a time string to UTC Date, assuming it's in Vietnam timezone (UTC+7) if no timezone info is provided
 * @param timeString - Time string from frontend (e.g., "2025-10-03T05:00")
 * @returns UTC Date object
 */
export function convertVietnamTimeToUTC(timeString: string): Date {
  if (!timeString) {
    throw new Error('Time string is required');
  }

  // If time string has timezone info (Z, +, -), use it as is
  if (timeString.includes('Z') || timeString.includes('+') || timeString.includes('-')) {
    const date = new Date(timeString);
    return new Date(date.getTime() + 7 * 60 * 60 * 1000);
  }
  

  // If no timezone info, assume it's Vietnam time (UTC+7)
  // Frontend sends "2025-10-03T05:00" which should be treated as Vietnam time
  // We need to convert it to UTC by subtracting 7 hours
  
  // Parse the time string manually to avoid timezone issues
  const [datePart, timePart] = timeString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  
  // Create date in Vietnam timezone (UTC+7) first
  // Vietnam time 05:00 on 2025-10-03 = UTC 12:00 on 2025-10-03 (add 7 hours)
  const vietnamTime = new Date(Date.UTC(year, month - 1, day, hour, minute));
  // Convert from Vietnam time to UTC by adding 7 hours
  return new Date(vietnamTime.getTime() + 7 * 60 * 60 * 1000);
}

/**
 * Converts UTC Date to Vietnam timezone string
 * @param utcDate - UTC Date object
 * @returns Vietnam timezone string (e.g., "2025-10-03T12:00:00+07:00")
 */
export function convertUTCToVietnamTime(utcDate: Date): string {
  const vietnamTime = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
  return vietnamTime.toISOString().replace('Z', '+07:00');
}

/**
 * Gets current Vietnam time
 * @returns Current Vietnam time as Date object
 */
export function getCurrentVietnamTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
}

/**
 * Converts UTC Date object to Vietnam timezone Date object
 * @param utcDate - UTC Date object
 * @returns Vietnam timezone Date object (UTC+7)
 */
export function convertUTCDateToVietnamDate(utcDate: Date): Date {
  return new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
}

/**
 * Validates if a time string is in correct format
 * @param timeString - Time string to validate
 * @returns boolean indicating if format is valid
 */
export function isValidTimeFormat(timeString: string): boolean {
  if (!timeString) return false;
  
  const date = new Date(timeString);
  return !isNaN(date.getTime());
}
