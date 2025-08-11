import crypto from 'crypto';
import { User } from "@/lib/mongodb/models/User";
import { connectDB } from "@/lib/mongodb/connection";

export interface DeviceFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  cookiesEnabled: boolean;
}

export function generateFingerprint(device: DeviceFingerprint): string {
  const fingerprintString = [
    device.userAgent,
    device.screenResolution,
    device.timezone,
    device.language,
    device.platform,
    device.cookiesEnabled.toString()
  ].join('|');
  
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
}

export async function storeDeviceFingerprint(
  userId: string, 
  fingerprint: string,
  trustLevel: 'trusted' | 'suspicious' | 'blocked' = 'trusted',
  deviceName?: string
): Promise<void> {
  try {
    await connectDB();
    const user = await User.findById(userId);
    if (user) {
      await user.addTrustedDevice(fingerprint, deviceName);
    }
  } catch (error) {
    console.error('Error storing device fingerprint:', error);
  }
}

export async function verifyDeviceFingerprint(
  userId: string, 
  fingerprint: string
): Promise<boolean> {
  try {
    await connectDB();
    const user = await User.findById(userId);
    return user ? user.isTrustedDevice(fingerprint) : false;
  } catch (error) {
    console.error('Error verifying device fingerprint:', error);
    return false;
  }
}
