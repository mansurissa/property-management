import { Request, Response, NextFunction } from 'express';
import { verifyToken, UserRole } from '../utils/jwt.utils';

export { UserRole };

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Generic role authorization middleware factory
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.role || !allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
};

// Specific role middlewares for convenience
export const authorizeSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin privileges required.'
    });
  }
  next();
};

export const authorizeAgency = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'agency') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Agency privileges required.'
    });
  }
  next();
};

export const authorizeOwner = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Owner privileges required.'
    });
  }
  next();
};

export const authorizeTenant = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'tenant') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Tenant privileges required.'
    });
  }
  next();
};

export const authorizeMaintenance = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'maintenance') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Maintenance staff privileges required.'
    });
  }
  next();
};

export const authorizeManager = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Manager privileges required.'
    });
  }
  next();
};

export const authorizeAgent = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'agent') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Agent privileges required.'
    });
  }
  next();
};

// Combined role middlewares for common use cases
export const authorizePropertyManagement = authorizeRoles('super_admin', 'agency', 'owner', 'manager');
export const authorizeAdmin = authorizeRoles('super_admin');
export const authorizeAgencyOrOwner = authorizeRoles('agency', 'owner');
export const authorizeOwnerOrManager = authorizeRoles('owner', 'manager');
export const authorizeStaff = authorizeRoles('super_admin', 'agency', 'maintenance');
export const authorizeAgentOrAdmin = authorizeRoles('super_admin', 'agent');

// Alias for requireRole - more intuitive naming
export const requireRole = (...roles: UserRole[]) => authorizeRoles(...roles);
