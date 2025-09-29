// ============= Supabase Team Management Service =============
// Replaces localStorage-based team management with Supabase

import { supabase } from '@/integrations/supabase/client';
import { debug } from '@/lib/debug';

export type UserRole = 'owner' | 'admin' | 'staff';

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenant_id: string;
  created_at: string;
  invited_by?: string;
  active: boolean;
};

const listeners = new Set<() => void>();

// ============= Core Team Operations =============

export async function listTeamMembers(): Promise<TeamMember[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      debug.warn('No authenticated user for team listing');
      return [];
    }

    // Get user's tenant_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.tenant_id) {
      debug.warn('No tenant found for user');
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: true });

    if (error) {
      debug.error('Error fetching team members:', error);
      return [];
    }

    return (data || []).map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role as UserRole,
      tenant_id: member.tenant_id!,
      created_at: member.created_at,
      active: true // All Supabase users are active
    }));
  } catch (error) {
    debug.error('Failed to list team members:', error);
    return [];
  }
}

export async function getTeamMember(id: string): Promise<TeamMember | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      debug.error('Error fetching team member:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      tenant_id: data.tenant_id!,
      created_at: data.created_at,
      active: true
    };
  } catch (error) {
    debug.error('Failed to get team member:', error);
    return null;
  }
}

export async function getCurrentUserRole(): Promise<UserRole> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return 'staff';

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) {
      debug.error('Error fetching current user role:', error);
      return 'staff';
    }

    return data.role as UserRole;
  } catch (error) {
    debug.error('Failed to get current user role:', error);
    return 'staff';
  }
}

export async function createTeamMember(data: {
  name: string;
  email: string;
  role: UserRole;
}): Promise<{ success: boolean; error?: string; member?: TeamMember }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    // Get current user's tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.tenant_id) {
      return { success: false, error: 'No tenant found' };
    }

    // Create new user (in real app, this would send invitation)
    const newUserId = crypto.randomUUID();
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: newUserId,
        name: data.name,
        email: data.email,
        role: data.role,
        tenant_id: profile.tenant_id
      })
      .select()
      .single();

    if (error) {
      debug.error('Error creating team member:', error);
      return { success: false, error: error.message };
    }

    const member: TeamMember = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as UserRole,
      tenant_id: newUser.tenant_id!,
      created_at: newUser.created_at,
      active: true
    };

    // Notify listeners
    listeners.forEach(fn => fn());

    return { success: true, member };
  } catch (error) {
    debug.error('Failed to create team member:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function updateTeamMember(id: string, updates: Partial<Pick<TeamMember, 'name' | 'email' | 'role'>>): Promise<{ success: boolean; error?: string; member?: TeamMember }> {
  try {
    // Check if we're trying to change the last owner
    if (updates.role && updates.role !== 'owner') {
      const { data: currentMember } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', id)
        .single();

      if (currentMember?.role === 'owner') {
        const { data: owners } = await supabase
          .from('users')
          .select('id')
          .eq('tenant_id', currentMember.tenant_id)
          .eq('role', 'owner');

        if (owners && owners.length <= 1) {
          return { success: false, error: 'Cannot change role: At least one owner must remain' };
        }
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      debug.error('Error updating team member:', error);
      return { success: false, error: error.message };
    }

    const member: TeamMember = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      tenant_id: data.tenant_id!,
      created_at: data.created_at,
      active: true
    };

    // Notify listeners
    listeners.forEach(fn => fn());

    return { success: true, member };
  } catch (error) {
    debug.error('Failed to update team member:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function deleteTeamMember(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    // Prevent removing current user
    if (id === user.id) {
      return { success: false, error: 'Cannot remove current user' };
    }

    // Check if removing the last owner
    const { data: memberToDelete } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', id)
      .single();

    if (memberToDelete?.role === 'owner') {
      const { data: owners } = await supabase
        .from('users')
        .select('id')
        .eq('tenant_id', memberToDelete.tenant_id)
        .eq('role', 'owner');

      if (owners && owners.length <= 1) {
        return { success: false, error: 'Cannot remove the last owner' };
      }
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      debug.error('Error deleting team member:', error);
      return { success: false, error: error.message };
    }

    // Notify listeners
    listeners.forEach(fn => fn());

    return { success: true };
  } catch (error) {
    debug.error('Failed to delete team member:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// ============= Utility Functions =============

export function subscribe(fn: () => void): () => void {
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

// ============= Hooks for Components =============

export function useTeamMembers() {
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadMembers() {
      setLoading(true);
      const teamMembers = await listTeamMembers();
      setMembers(teamMembers);
      setLoading(false);
    }

    loadMembers();
    return subscribe(loadMembers);
  }, []);

  return { members, loading };
}

export function useCurrentUserRole() {
  const [role, setRole] = React.useState<UserRole>('staff');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadRole() {
      setLoading(true);
      const userRole = await getCurrentUserRole();
      setRole(userRole);
      setLoading(false);
    }

    loadRole();
  }, []);

  return { role, loading };
}

// Add React import for hooks
import React from 'react';