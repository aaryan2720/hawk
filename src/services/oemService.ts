
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { OEMSource } from '@/types';

export const fetchUserOEMSources = async (userId: string): Promise<OEMSource[]> => {
  try {
    const { data, error } = await supabase
      .from('oem_sources')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data as OEMSource[];
  } catch (error) {
    console.error('Error fetching OEM sources:', error);
    toast.error('Failed to load OEM sources');
    return [];
  }
};

export const addOEMSource = async (
  userId: string,
  name: string,
  url: string,
  systemType: string
): Promise<OEMSource | null> => {
  try {    
    const { data, error } = await supabase
      .from('oem_sources')
      .insert({
        user_id: userId,
        name: name,
        url: url,
        system_type: systemType,
        is_active: true
      })
      .select('*')
      .single();

    if (error) throw error;
    
    toast.success('OEM source added successfully');
    return data as OEMSource;
  } catch (error) {
    console.error('Error adding OEM source:', error);
    toast.error('Failed to add OEM source');
    return null;
  }
};

export const updateOEMSource = async (
  sourceId: string,
  updates: Partial<OEMSource>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('oem_sources')
      .update(updates)
      .eq('id', sourceId);

    if (error) throw error;
    
    toast.success('OEM source updated');
    return true;
  } catch (error) {
    console.error('Error updating OEM source:', error);
    toast.error('Failed to update OEM source');
    return false;
  }
};

export const deleteOEMSource = async (sourceId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('oem_sources')
      .delete()
      .eq('id', sourceId);

    if (error) throw error;
    
    toast.success('OEM source deleted');
    return true;
  } catch (error) {
    console.error('Error deleting OEM source:', error);
    toast.error('Failed to delete OEM source');
    return false;
  }
};

export const testOEMSource = async (source: OEMSource): Promise<boolean> => {
  try {
    // Call Edge Function to test the OEM source
    const response = await fetch('https://eogwxywiidsnnlaybbdd.supabase.co/functions/v1/test-oem-scraper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        url: source.url,
        name: source.name,
        system_type: source.system_type
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to test source');
    }
    
    const result = await response.json();
    
    if (result.success) {
      toast.success(`Test successful: Found ${result.vulnerabilitiesCount || 0} potential vulnerabilities`);
      return true;
    } else {
      toast.error(`Test failed: ${result.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error('Error testing OEM source:', error);
    toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};
