export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: 'Au moins 8 caractères', test: (p) => p.length >= 8 },
  { id: 'lower', label: 'Une lettre minuscule', test: (p) => /[a-z]/.test(p) },
  { id: 'upper', label: 'Une lettre majuscule', test: (p) => /[A-Z]/.test(p) },
  { id: 'digit', label: 'Un chiffre', test: (p) => /\d/.test(p) },
  {
    id: 'special',
    label: 'Un caractère spécial (!@#$%…)',
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

export function isPasswordStrong(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

export function passwordStrengthScore(password: string): number {
  return PASSWORD_RULES.filter((rule) => rule.test(password)).length;
}

export function passwordStrengthLabel(password: string): 'Faible' | 'Moyen' | 'Fort' | '' {
  if (!password) {
    return '';
  }
  const score = passwordStrengthScore(password);
  if (score <= 2) {
    return 'Faible';
  }
  if (score <= 4) {
    return 'Moyen';
  }
  return 'Fort';
}

export function passwordStrengthPercent(password: string): number {
  return Math.round((passwordStrengthScore(password) / PASSWORD_RULES.length) * 100);
}

export const PASSWORD_POLICY_HINT =
  '8 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial.';
