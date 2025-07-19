import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn (...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

/**
 * Utility functions for the application
 */

/**
 * Formats a file size in bytes to a human-readable string (KB, MB, GB)
 * @param bytes - The size in bytes
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns A formatted string with the appropriate unit (B, KB, MB, GB, TB)
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  // Calculate the appropriate unit index
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Format the number with the specified decimal places
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

export const generateUUID = () => crypto.randomUUID();
