import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string): string {
  // eslint-disable-next-line no-use-before-define
  if (typeof window !== "undefined") return path;
  // eslint-disable-next-line no-use-before-define
  if (
    process.env?.VERCEL_URL !== null &&
    // eslint-disable-next-line no-use-before-define
    process.env?.VERCEL_URL !== undefined &&
    // eslint-disable-next-line no-use-before-define
    process.env?.VERCEL_URL !== ""
    // eslint-disable-next-line no-use-before-define
  )
    // return `http://localhost:3000`;
    // eslint-disable-next-line no-use-before-define
    return `https://${process.env.VERCEL_URL}`;
  // eslint-disable-next-line no-use-before-define

  return `http://localhost:3000`;
  // eslint-disable-next-line no-use-before-define
}
