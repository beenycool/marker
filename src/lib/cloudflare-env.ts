// Cloudflare Workers environment helper
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function getEnv() {
  try {
    const cf = await getCloudflareContext();
    return cf.env;
  } catch (error) {
    // Fallback to process.env for local development
    return process.env;
  }
}

export async function getEnvVar(key: string): Promise<string | undefined> {
  const env = await getEnv();
  return (env as any)[key];
}

export async function requireEnvVar(key: string): Promise<string> {
  const value = await getEnvVar(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
