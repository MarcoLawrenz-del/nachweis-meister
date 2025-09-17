// ============= Team Store =============
// localStorage-based store for team management

export type UserRole = 'owner' | 'admin' | 'staff';

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string; // ISO
  invited_by?: string;
  active: boolean;
};

const teamMap = new Map<string, TeamMember>();
const listeners = new Set<() => void>();

const LS_KEY = "subfix.team.v1";

function load(): TeamMember[] {
  if (typeof window === "undefined") return [];
  try {
    const s = localStorage.getItem(LS_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function save(members: TeamMember[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(members));
  } catch {}
}

function loadToMap() {
  const members = load();
  teamMap.clear();
  members.forEach(m => teamMap.set(m.id, m));
}

function saveFromMap() {
  const members = Array.from(teamMap.values());
  save(members);
  listeners.forEach(fn => fn());
}

// Initialize with default owner if empty
function initializeTeam() {
  if (teamMap.size === 0) {
    const defaultOwner: TeamMember = {
      id: 'current-user',
      name: 'Aktueller Benutzer',
      email: 'demo@subfix.app',
      role: 'owner',
      created_at: new Date().toISOString(),
      active: true
    };
    teamMap.set(defaultOwner.id, defaultOwner);
    saveFromMap();
  }
}

// Auto-add current user if they don't exist in team
export function ensureCurrentUserInTeam() {
  const { getSession } = require('./auth'); // Dynamic import to avoid circular deps
  const session = getSession();
  
  if (session) {
    // Update the current user's info if they exist
    const currentUser = teamMap.get('current-user');
    if (currentUser && currentUser.email !== session.user.email) {
      // Update existing user with real session data
      currentUser.name = session.user.name || currentUser.name;
      currentUser.email = session.user.email;
      saveFromMap();
    }
  }
}

// Initialize on first import
loadToMap();
initializeTeam();

export function listTeamMembers(): TeamMember[] {
  return Array.from(teamMap.values()).sort((a, b) => {
    // Sort by role priority, then by creation date
    const rolePriority = { owner: 0, admin: 1, staff: 2 };
    const aPriority = rolePriority[a.role];
    const bPriority = rolePriority[b.role];
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function getTeamMember(id: string): TeamMember | undefined {
  return teamMap.get(id);
}

export function getCurrentUserRole(): UserRole {
  const currentUser = teamMap.get('current-user');
  return currentUser?.role || 'staff';
}

export function createTeamMember(data: Omit<TeamMember, "id"|"created_at"|"active"> & { active?: boolean }): TeamMember {
  const id = crypto.randomUUID();
  const member: TeamMember = {
    id,
    ...data,
    active: data.active ?? true,
    created_at: new Date().toISOString(),
  };
  
  teamMap.set(id, member);
  saveFromMap();
  return member;
}

export function updateTeamMember(id: string, patch: Partial<TeamMember>): TeamMember {
  const existing = teamMap.get(id);
  if (!existing) {
    throw new Error(`Team member with id ${id} not found`);
  }
  
  // Prevent removing the last owner
  if (patch.role && patch.role !== 'owner' && existing.role === 'owner') {
    const owners = Array.from(teamMap.values()).filter(m => m.role === 'owner');
    if (owners.length <= 1) {
      throw new Error('Cannot change role: At least one owner must remain');
    }
  }
  
  const updated = { ...existing, ...patch };
  teamMap.set(id, updated);
  saveFromMap();
  return updated;
}

export function deleteTeamMember(id: string): void {
  const member = teamMap.get(id);
  if (!member) {
    throw new Error(`Team member with id ${id} not found`);
  }
  
  // Prevent removing the current user
  if (id === 'current-user') {
    throw new Error('Cannot remove current user');
  }
  
  // Prevent removing the last owner
  if (member.role === 'owner') {
    const owners = Array.from(teamMap.values()).filter(m => m.role === 'owner');
    if (owners.length <= 1) {
      throw new Error('Cannot remove the last owner');
    }
  }
  
  teamMap.delete(id);
  saveFromMap();
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function canManageTeam(role: UserRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canEditMember(currentUserRole: UserRole, targetMemberRole: UserRole): boolean {
  if (currentUserRole === 'owner') return true;
  if (currentUserRole === 'admin' && targetMemberRole !== 'owner') return true;
  return false;
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'owner': return 'Inhaber';
    case 'admin': return 'Administrator';
    case 'staff': return 'Mitarbeiter';
    default: return role;
  }
}