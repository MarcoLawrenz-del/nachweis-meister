import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Package {
  id: string;
  code: string;
  name_de: string;
  name_en: string;
  description_de?: string;
  description_en?: string;
  sort_order: number;
  active: boolean;
}

export interface PackageItem {
  id: string;
  package_id: string;
  document_type_id: string;
  is_required: boolean;
  sort_order: number;
  document_type?: {
    id: string;
    code: string;
    name_de: string;
    name_en?: string;
    description_de?: string;
    description_en?: string;
  };
}

export interface DocumentSelection {
  document_type_id: string;
  is_required: boolean;
  is_selected: boolean;
}

export function usePackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [packageItems, setPackageItems] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all packages
  const loadPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('active', true)
        .order('sort_order');

      if (error) throw error;
      setPackages(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading packages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load package items with document types
  const loadPackageItems = async (packageId: string) => {
    try {
      const { data, error } = await supabase
        .from('package_items')
        .select(`
          *,
          document_type:document_types(*)
        `)
        .eq('package_id', packageId)
        .order('sort_order');

      if (error) throw error;
      setPackageItems(data || []);
      return data || [];
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading package items:', err);
      return [];
    }
  };

  // Get default package - legacy removed, replaced with Standard
  const getDefaultPackage = () => {
    return packages.find(p => p.code === 'STANDARD') || packages[0];
  };

  // Create document selection from package
  const createDocumentSelection = (items: PackageItem[]): DocumentSelection[] => {
    return items.map(item => ({
      document_type_id: item.document_type_id,
      is_required: item.is_required,
      is_selected: true // Initially all documents in package are selected
    }));
  };

  useEffect(() => {
    loadPackages();
  }, []);

  return {
    packages,
    packageItems,
    loading,
    error,
    loadPackageItems,
    getDefaultPackage,
    createDocumentSelection
  };
}