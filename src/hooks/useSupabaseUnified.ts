// ============= Unified Supabase Hook =============
// This hook replaces ALL localStorage-based data management

import { useState, useEffect } from 'react';
import { useAppMode } from './useAppMode';
import { useEnhancedDemoData } from './useEnhancedDemoData';
import * as supabaseService from '@/services/supabaseUnified';
import type { Contractor } from '@/types/contractor';
import { debug } from '@/lib/debug';

export function useSupabaseUnified() {
  const { isDemo } = useAppMode();
  const demoData = useEnhancedDemoData();
  
  const [subcontractors, setSubcontractors] = useState<Contractor[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============= Data Loading =============
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      
      try {
        if (isDemo) {
          debug.log('🎯 Using demo data');
          // Map demo data to Contractor type
          const mappedDemo: Contractor[] = demoData.demoSubcontractors.map(sub => ({
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
          setSubcontractors(mappedDemo);
          setSettings({});
        } else {
          debug.log('🎯 Loading Supabase data');
          const [contractorsData, settingsData] = await Promise.all([
            supabaseService.getSubcontractors(),
            supabaseService.getUserSettings()
          ]);
          
          setSubcontractors(contractorsData);
          setSettings(settingsData);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        debug.error('Error loading data:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [isDemo, demoData.demoSubcontractors]);

  // ============= Contractor Operations =============
  const createContractor = async (contractorData: Omit<Contractor, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isDemo) {
      debug.warn('Create contractor called in demo mode - operation ignored');
      return;
    }
    
    try {
      const newContractor = await supabaseService.createSubcontractor(contractorData);
      setSubcontractors(prev => [...prev, newContractor]);
      
      await supabaseService.logActivity({
        type: 'contractor_created',
        message: `Subcontractor ${newContractor.companyName} created`,
        metadata: { contractorId: newContractor.id }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create contractor';
      setError(errorMessage);
      throw err;
    }
  };

  const updateContractor = async (id: string, updates: Partial<Contractor>) => {
    if (isDemo) {
      debug.warn('Update contractor called in demo mode - operation ignored');
      return;
    }
    
    try {
      await supabaseService.updateSubcontractor(id, updates);
      setSubcontractors(prev => 
        prev.map(contractor => 
          contractor.id === id 
            ? { ...contractor, ...updates, updatedAt: new Date().toISOString() }
            : contractor
        )
      );
      
      await supabaseService.logActivity({
        type: 'contractor_updated',
        message: `Subcontractor ${updates.companyName || id} updated`,
        metadata: { contractorId: id, updates }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contractor';
      setError(errorMessage);
      throw err;
    }
  };

  // ============= Settings Operations =============
  const updateSettings = async (newSettings: Record<string, any>) => {
    if (isDemo) {
      debug.warn('Update settings called in demo mode - operation ignored');
      setSettings(prev => ({ ...prev, ...newSettings }));
      return;
    }
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await supabaseService.saveUserSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      throw err;
    }
  };

  // ============= Utility Functions =============
  const logActivity = async (activity: {
    type: string;
    message: string;
    metadata?: Record<string, any>;
  }) => {
    if (isDemo) {
      debug.log(`📊 Demo activity: ${activity.type} - ${activity.message}`);
      return;
    }
    
    await supabaseService.logActivity(activity);
  };

  const checkRateLimit = async (key: string, limit?: number, windowMs?: number) => {
    if (isDemo) {
      return true; // Always allow in demo
    }
    
    return supabaseService.checkRateLimit(key, limit, windowMs);
  };

  return {
    // Data
    subcontractors,
    settings,
    loading,
    error,
    isDemo,
    
    // Operations
    createContractor,
    updateContractor,
    updateSettings,
    logActivity,
    checkRateLimit,
    
    // Utility
    clearError: () => setError(null)
  };
}