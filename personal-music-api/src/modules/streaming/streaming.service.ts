import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class StreamingService {
  private tokens = new Map<string, { songId: number; expiresAt: number }>();

  /**
   * Create a short-lived token for a song
   * @param songId 
   * @param ttlSeconds Default 60 seconds
   */
  createToken(songId: number, ttlSeconds = 60): string {
    const token = randomUUID();
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.tokens.set(token, { songId, expiresAt });

    setTimeout(() => {
      this.tokens.delete(token);
    }, ttlSeconds * 1000 + 5000);

    return token;
  }

  /**
   * Validate and consume a token
   * @param token 
   * @param songId 
   */
  validateToken(token: string, songId: number): boolean {
    const entry = this.tokens.get(token);
    if (!entry) return false;

    if (Number(entry.songId) !== Number(songId)) return false;

    if (Date.now() > entry.expiresAt) {
      this.tokens.delete(token);
      return false;
    }

    return true;
  }

  private cleanup() {
    const now = Date.now();
    for (const [token, entry] of this.tokens.entries()) {
      if (now > entry.expiresAt) {
        this.tokens.delete(token);
      }
    }
  }
}
