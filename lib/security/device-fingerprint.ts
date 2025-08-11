// lib/security/device-fingerprint.ts
import crypto from 'crypto'

export interface DeviceFingerprint {
  userAgent: string
  screenResolution: string
  timezone: string
  language: string
  platform: string
  cookiesEnabled: boolean
}

export function generateFingerprint(device: DeviceFingerprint): string {
  const fingerprintString = [
    device.userAgent,
    device.screenResolution,
    device.timezone,
    device.language,
    device.platform,
    device.cookiesEnabled.toString()
  ].join('|')
  
  return crypto.createHash('sha256').update(fingerprintString).digest('hex')
}

export async function storeDeviceFingerprint(
  userId: string, 
  fingerprint: string,
  trustLevel: 'trusted' | 'suspicious' | 'blocked' = 'trusted'
): Promise<void> {
  // Store in database or cache
  await redis.setex(`device:${userId}:${fingerprint}`, 30 * 24 * 60 * 60, trustLevel)
}

export async function verifyDeviceFingerprint(
  userId: string, 
  fingerprint: string
): Promise<boolean> {
  const trustLevel = await redis.get(`device:${userId}:${fingerprint}`)
  return trustLevel === 'trusted'
}