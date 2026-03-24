export const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const hasMinimumPasswordLength = (value: string, min = 8): boolean => {
  return value.trim().length >= min;
};

export type PasswordRequirement = {
  label: string;
  met: boolean;
};

export type PasswordStrength = {
  score: number;
  level: "mala" | "intermedia" | "buena";
  requirements: PasswordRequirement[];
};

export const getPasswordStrength = (value: string): PasswordStrength => {
  const requirements: PasswordRequirement[] = [
    { label: "Minimo 8 caracteres", met: hasMinimumPasswordLength(value) },
    { label: "Al menos una mayuscula", met: /[A-Z]/.test(value) },
    { label: "Al menos una minuscula", met: /[a-z]/.test(value) },
    { label: "Al menos un caracter especial", met: /[^A-Za-z0-9]/.test(value) },
  ];

  const score = requirements.filter((item) => item.met).length;

  if (score <= 2) {
    return { score, level: "mala", requirements };
  }

  if (score === 3) {
    return { score, level: "intermedia", requirements };
  }

  return { score, level: "buena", requirements };
};

export const isStrongPassword = (value: string): boolean => {
  return getPasswordStrength(value).score === 4;
};

export const sanitizePhoneDigits = (value: string): string => {
  return value.replace(/\D/g, "").slice(0, 8);
};

export const isValidBolivianPhone = (value: string): boolean => {
  return /^[23467]\d{7}$/.test(value);
};

