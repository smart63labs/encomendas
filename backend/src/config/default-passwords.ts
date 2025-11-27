// Centralização de senhas padrão por role
export const DEFAULT_ROLE_PASSWORDS = {
  ADMIN: 'Admin@123',
  USER: 'User@123'
} as const;

// Alguns sistemas usam variações como 'ADMINISTRADOR' ou 'GERENTE' para perfis administrativos
const ADMIN_ALIASES = ['ADMIN', 'ADMINISTRADOR', 'GERENTE'];

export function getDefaultPasswordForRole(role?: string): string {
  const normalized = String(role || 'USER').trim().toUpperCase();
  const isAdmin = ADMIN_ALIASES.includes(normalized);
  return isAdmin ? DEFAULT_ROLE_PASSWORDS.ADMIN : DEFAULT_ROLE_PASSWORDS.USER;
}