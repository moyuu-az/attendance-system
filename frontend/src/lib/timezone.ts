/**
 * JST (Japan Standard Time) timezone utility functions for the frontend.
 * 
 * This module provides utilities for handling timezone conversions and getting 
 * current JST time to ensure consistent time handling across the frontend application.
 */

import { formatDistanceToNow, parseISO } from 'date-fns';
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { ja } from 'date-fns/locale';

// Japan Standard Time timezone
export const JST_TIMEZONE = 'Asia/Tokyo';

/**
 * Get current Date object in JST timezone.
 * 
 * @returns Date object representing current time in JST
 */
export function nowJST(): Date {
  return toZonedTime(new Date(), JST_TIMEZONE);
}

/**
 * Get current date string in JST timezone.
 * 
 * @returns Date string in YYYY-MM-DD format in JST
 */
export function todayJST(): string {
  return formatInTimeZone(new Date(), JST_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Get current time string in JST timezone.
 * 
 * @returns Time string in HH:mm:ss format in JST
 */
export function nowTimeJST(): string {
  return formatInTimeZone(new Date(), JST_TIMEZONE, 'HH:mm:ss');
}

/**
 * Convert Date object to JST timezone.
 * 
 * @param date - Date object to convert
 * @returns Date object converted to JST timezone
 */
export function toJST(date: Date): Date {
  return toZonedTime(date, JST_TIMEZONE);
}

/**
 * Convert JST time to UTC for API calls.
 * 
 * @param date - Date object in JST
 * @returns Date object converted to UTC
 */
export function jstToUTC(date: Date): Date {
  return fromZonedTime(date, JST_TIMEZONE);
}

/**
 * Format date in JST timezone with Japanese locale.
 * 
 * @param date - Date object or ISO string to format
 * @param formatStr - Format string for date formatting
 * @returns Formatted date string in JST with Japanese locale
 */
export function formatJST(date: Date | string, formatStr: string = 'yyyy年MM月dd日(E) HH:mm'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, JST_TIMEZONE, formatStr, { locale: ja });
}

/**
 * Format date as display date (YYYY年MM月DD日(曜日)).
 * 
 * @param date - Date object or ISO string
 * @returns Formatted date string with Japanese day of week
 */
export function formatDateJST(date: Date | string): string {
  return formatJST(date, 'yyyy年MM月dd日(E)');
}

/**
 * Format time in JST timezone (HH:mm format).
 * 
 * @param date - Date object or ISO string
 * @returns Formatted time string in HH:mm format
 */
export function formatTimeJST(date: Date | string): string {
  return formatJST(date, 'HH:mm');
}

/**
 * Format time in JST timezone with seconds (HH:mm:ss format).
 * 
 * @param date - Date object or ISO string
 * @returns Formatted time string in HH:mm:ss format
 */
export function formatTimeWithSecondsJST(date: Date | string): string {
  return formatJST(date, 'HH:mm:ss');
}

/**
 * Format datetime in JST timezone for display.
 * 
 * @param date - Date object or ISO string
 * @returns Formatted datetime string
 */
export function formatDateTimeJST(date: Date | string): string {
  return formatJST(date, 'yyyy年MM月dd日(E) HH:mm');
}

/**
 * Get relative time from now in JST (e.g., "2時間前").
 * 
 * @param date - Date object or ISO string
 * @returns Relative time string in Japanese
 */
export function formatRelativeTimeJST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const jstDate = toJST(dateObj);
  
  return formatDistanceToNow(jstDate, { 
    addSuffix: true, 
    locale: ja,
    includeSeconds: true 
  });
}

/**
 * Check if two dates are the same day in JST.
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if both dates are on the same JST day
 */
export function isSameDayJST(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  const jst1 = formatInTimeZone(d1, JST_TIMEZONE, 'yyyy-MM-dd');
  const jst2 = formatInTimeZone(d2, JST_TIMEZONE, 'yyyy-MM-dd');
  
  return jst1 === jst2;
}

/**
 * Get start of day in JST (00:00:00).
 * 
 * @param date - Date object or ISO string (optional, defaults to current date)
 * @returns Date object representing start of day in JST
 */
export function getJSTStartOfDay(date?: Date | string): Date {
  const targetDate = date 
    ? (typeof date === 'string' ? parseISO(date) : date)
    : new Date();
  
  const jstDate = toJST(targetDate);
  const startOfDay = new Date(jstDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  return startOfDay;
}

/**
 * Get end of day in JST (23:59:59.999).
 * 
 * @param date - Date object or ISO string (optional, defaults to current date)
 * @returns Date object representing end of day in JST
 */
export function getJSTEndOfDay(date?: Date | string): Date {
  const targetDate = date 
    ? (typeof date === 'string' ? parseISO(date) : date)
    : new Date();
  
  const jstDate = toJST(targetDate);
  const endOfDay = new Date(jstDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  return endOfDay;
}

/**
 * Create a Date object from date and time strings in JST.
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:mm or HH:mm:ss format
 * @returns Date object in JST
 */
export function createJSTDateTime(dateStr: string, timeStr: string): Date {
  const dateTimeStr = `${dateStr}T${timeStr}`;
  const date = new Date(dateTimeStr);
  return toZonedTime(date, JST_TIMEZONE);
}

/**
 * Get current month and year in JST.
 * 
 * @returns Object with current year and month in JST
 */
export function getCurrentMonthJST(): { year: number; month: number } {
  const now = nowJST();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1 // JavaScript months are 0-indexed
  };
}

/**
 * Calculate elapsed time from start time to now in JST.
 * 
 * @param startTime - Start time string in HH:mm:ss format
 * @param currentDate - Current date string in YYYY-MM-DD format (optional)
 * @returns Elapsed time in seconds
 */
export function calculateElapsedTimeJST(startTime: string, currentDate?: string): number {
  const today = currentDate || todayJST();
  const startDateTime = createJSTDateTime(today, startTime);
  const now = nowJST();
  
  return Math.floor((now.getTime() - startDateTime.getTime()) / 1000);
}

/**
 * Format elapsed seconds to HH:mm:ss format.
 * 
 * @param seconds - Elapsed seconds
 * @returns Formatted time string
 */
export function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}