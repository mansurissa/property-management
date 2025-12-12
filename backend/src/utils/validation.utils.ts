export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

export interface PasswordRequirements {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false // Optional but improves strength
};

export const validatePassword = (
  password: string,
  requirements: PasswordRequirements = DEFAULT_REQUIREMENTS
): PasswordValidationResult => {
  const errors: string[] = [];
  let strengthScore = 0;

  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false
  } = requirements;

  // Check minimum length
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  } else {
    strengthScore += 1;
    if (password.length >= 12) strengthScore += 1;
    if (password.length >= 16) strengthScore += 1;
  }

  // Check uppercase
  const hasUppercase = /[A-Z]/.test(password);
  if (requireUppercase && !hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (hasUppercase) {
    strengthScore += 1;
  }

  // Check lowercase
  const hasLowercase = /[a-z]/.test(password);
  if (requireLowercase && !hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (hasLowercase) {
    strengthScore += 1;
  }

  // Check numbers
  const hasNumbers = /[0-9]/.test(password);
  if (requireNumbers && !hasNumbers) {
    errors.push('Password must contain at least one number');
  } else if (hasNumbers) {
    strengthScore += 1;
  }

  // Check special characters
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (requireSpecialChars && !hasSpecialChars) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  } else if (hasSpecialChars) {
    strengthScore += 2;
  }

  // Check for common patterns (weak passwords)
  const commonPatterns = [
    /^123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /letmein/i,
    /welcome/i,
    /admin/i,
    /^(.)\1+$/ // All same characters
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      strengthScore = Math.max(0, strengthScore - 2);
      break;
    }
  }

  // Determine strength level
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (strengthScore <= 2) {
    strength = 'weak';
  } else if (strengthScore <= 4) {
    strength = 'fair';
  } else if (strengthScore <= 6) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Rwandan format)
export const validateRwandanPhone = (phone: string): boolean => {
  // Accepts: +250xxxxxxxxx, 250xxxxxxxxx, 07xxxxxxxx, 078xxxxxxx
  const phoneRegex = /^(\+?250|0)?7[2-9]\d{7}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

// National ID validation (Rwanda format - 16 digits)
export const validateNationalId = (nationalId: string): boolean => {
  const cleanId = nationalId.replace(/[\s-]/g, '');
  return /^\d{16}$/.test(cleanId);
};
