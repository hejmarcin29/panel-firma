
type RateLimitEntry = {
    attempts: number;
    resetAt: number;
    blockedUntil?: number;
};

// In-memory store (Note: In serverless this might reset, but fine for VPS/PM2)
const ipLimits = new Map<string, RateLimitEntry>();

export const rateLimit = {
    check: (identifier: string, limit: number = 5, windowMs: number = 60 * 1000, blockDurationMs: number = 3 * 60 * 1000) => {
        const now = Date.now();
        const entry = ipLimits.get(identifier) || { attempts: 0, resetAt: now + windowMs };

        // Cleanup expired
        if (now > entry.resetAt && !entry.blockedUntil) {
            entry.attempts = 0;
            entry.resetAt = now + windowMs;
        }

        // Check Block
        if (entry.blockedUntil && now < entry.blockedUntil) {
            return {
                success: false,
                blocked: true,
                remainingTime: Math.ceil((entry.blockedUntil - now) / 1000)
            };
        }
        
        // Remove block if expired
        if (entry.blockedUntil && now > entry.blockedUntil) {
            entry.blockedUntil = undefined;
            entry.attempts = 0;
            entry.resetAt = now + windowMs;
        }

        // Increment
        entry.attempts++;
        
        // Check Limit
        if (entry.attempts > limit) {
             entry.blockedUntil = now + blockDurationMs;
             ipLimits.set(identifier, entry);
             return {
                success: false,
                blocked: true,
                remainingTime: Math.ceil(blockDurationMs / 1000)
             };
        }

        ipLimits.set(identifier, entry);
        return { success: true };
    }
};
