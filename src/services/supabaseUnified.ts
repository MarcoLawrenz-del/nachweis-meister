// ============= Unified Supabase Service =============
// This replaces ALL localStorage-based services

import { supabase } from "@/integrations/supabase/client";
import type { Contractor, ContractorDocument } from "@/types/contractor";
import { debug } from "@/lib/debug";

// ============= Contractor Management =============
export async function getSubcontractors(): Promise<Contractor[]> {
  try {
    const { data, error } = await supabase
      .from('subcontractors')
      .select('*')
      .order('company_name');
    
    if (error) throw error;
    
    return data.map(sub => ({
      id: sub.id,
      companyName: sub.company_name,
      contactName: sub.contact_name || '',
      contactEmail: sub.contact_email,
      phone: sub.phone || '',
      address: sub.address || '',
      country: sub.country_code || 'DE',
      notes: sub.notes || '',
      active: sub.status === 'active',
      createdAt: sub.created_at,
      updatedAt: sub.updated_at || sub.created_at
    }));
  } catch (error) {
    debug.error('Error fetching subcontractors:', error);
    throw error;
  }
}

export async function createSubcontractor(contractor: Omit<Contractor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contractor> {
  try {
    const { data, error } = await supabase
      .from('subcontractors')
      .insert({
        company_name: contractor.companyName,
        contact_name: contractor.contactName,
        contact_email: contractor.contactEmail,
        phone: contractor.phone,
        address: contractor.address,
        country_code: contractor.country || 'DE',
        notes: contractor.notes,
        status: contractor.active ? 'active' : 'inactive',
        tenant_id: '00000000-0000-0000-0000-000000000001' // Demo tenant
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      companyName: data.company_name,
      contactName: data.contact_name || '',
      contactEmail: data.contact_email,
      phone: data.phone || '',
      address: data.address || '',
      country: data.country_code || 'DE',
      notes: data.notes || '',
      active: data.status === 'active',
      createdAt: data.created_at,
      updatedAt: data.updated_at || data.created_at
    };
  } catch (error) {
    debug.error('Error creating subcontractor:', error);
    throw error;
  }
}

export async function updateSubcontractor(id: string, updates: Partial<Contractor>): Promise<void> {
  try {
    const { error } = await supabase
      .from('subcontractors')
      .update({
        ...(updates.companyName && { company_name: updates.companyName }),
        ...(updates.contactName && { contact_name: updates.contactName }),
        ...(updates.contactEmail && { contact_email: updates.contactEmail }),
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.address && { address: updates.address }),
        ...(updates.country && { country_code: updates.country }),
        ...(updates.notes && { notes: updates.notes }),
        ...(updates.active !== undefined && { status: updates.active ? 'active' : 'inactive' }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    debug.error('Error updating subcontractor:', error);
    throw error;
  }
}

// ============= Settings Management =============
export async function getUserSettings(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings_data')
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data?.settings_data as Record<string, any> || {};
  } catch (error) {
    debug.error('Error fetching user settings:', error);
    return {};
  }
}

export async function saveUserSettings(settings: Record<string, any>): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: '00000000-0000-0000-0000-000000000001', // Demo user
        settings_data: settings
      });
    
    if (error) throw error;
  } catch (error) {
    debug.error('Error saving user settings:', error);
    throw error;
  }
}

// ============= Activity Logging =============
export async function logActivity(activity: {
  type: string;
  message: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: activity.type,
        properties: {
          message: activity.message,
          ...activity.metadata
        },
        tenant_id: '00000000-0000-0000-0000-000000000001'
      });
    
    if (error) throw error;
  } catch (error) {
    debug.error('Error logging activity:', error);
    // Don't throw - logging failures shouldn't break the app
  }
}

// ============= Rate Limiting =============
export async function checkRateLimit(key: string, limit: number = 5, windowMs: number = 60000): Promise<boolean> {
  // For demo purposes, we'll use a simple in-memory rate limiter
  // In production, this would use Redis or a proper rate limiting service
  const now = Date.now();
  const windowStart = now - windowMs;
  
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('timestamp')
      .eq('event_type', `rate_limit_${key}`)
      .gte('timestamp', new Date(windowStart).toISOString())
      .limit(limit);
    
    if (error) throw error;
    
    // If we have reached the limit, return false
    if (data.length >= limit) {
      return false;
    }
    
    // Log this attempt
    await logActivity({
      type: `rate_limit_${key}`,
      message: 'Rate limit check'
    });
    
    return true;
  } catch (error) {
    debug.error('Error checking rate limit:', error);
    return true; // Allow on error
  }
}