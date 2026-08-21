import type { Request } from "express";

export function extractIpAndUserAgent(req: Request): {
  ipAddress: string;
  userAgent: string;
} {
  if (!req) {
    return { ipAddress: "", userAgent: "" };
  }

  const xForwardedFor = req.headers["x-forwarded-for"] as string;
  const xRealIp = req.headers["x-real-ip"] as string;
  const ipAddress = xForwardedFor
    ? xForwardedFor.split(",")[0].trim()
    : xRealIp || req.ip || "";

  const userAgent = (req.headers["user-agent"] as string) || "";

  return { ipAddress, userAgent };
}

export function getIpAddress(req: Request): string {
  const { ipAddress } = extractIpAndUserAgent(req);
  return ipAddress;
}

export function getUserAgent(req: Request): string {
  const { userAgent } = extractIpAndUserAgent(req);
  return userAgent;
}

export default extractIpAndUserAgent;
