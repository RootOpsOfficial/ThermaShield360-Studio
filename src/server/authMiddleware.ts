import { Request, Response, NextFunction } from 'express';
import { supabase } from './supabase.js';
import { isAuthorizedApprover } from './authProfileService.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Express middleware that validates the Supabase access token from Authorization header.
 * Attaches the verified user ID and email to req.user.
 * Rejects requests with missing or invalid tokens with 401 Unauthorized.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid Authorization header with Bearer token.',
    });
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Bearer token is empty.',
    });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or expired session token.',
      });
    }

    req.user = {
      id: data.user.id,
      email: (data.user.email || '').trim().toLowerCase(),
    };

    next();
  } catch (err: any) {
    console.error('[authMiddleware] Authentication error:', err?.message || err);
    return res.status(401).json({
      error: 'Unauthorized: Failed to authenticate user session.',
    });
  }
}

/**
 * Express middleware that ensures the authenticated user has verified approval authority.
 * Must be preceded by requireAuth.
 */
export async function requireApprover(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id || !req.user.email) {
    return res.status(401).json({ error: 'Unauthorized: Session not verified.' });
  }

  try {
    const hasAuthority = await isAuthorizedApprover(req.user.id, req.user.email);
    if (!hasAuthority) {
      return res.status(403).json({
        error: 'Forbidden: You do not possess institutional approval authority to view or review access applications.',
      });
    }

    next();
  } catch (err: any) {
    console.error('[authMiddleware] Approver check error:', err?.message || err);
    return res.status(500).json({ error: 'Failed to verify approver authorization.' });
  }
}
