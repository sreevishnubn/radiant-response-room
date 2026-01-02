import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserPreferences {
  id: string;
  user_id: string;
  favorite_sites: string[];
  clothing_sizes: Record<string, string>;
  preferred_categories: string[];
  budget_range: { min?: number; max?: number; currency?: string };
}

export const usePreferences = (userId: string | undefined) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching preferences:", error);
    } else {
      setPreferences(data as UserPreferences | null);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!userId) return;

    const { error } = await supabase
      .from("user_preferences")
      .update(updates)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to save preferences");
    } else {
      toast.success("Preferences saved!");
      fetchPreferences();
    }
  };

  const addFavoriteSite = async (site: string) => {
    if (!preferences) return;
    const sites = [...(preferences.favorite_sites || []), site];
    await updatePreferences({ favorite_sites: sites });
  };

  const updateClothingSize = async (category: string, size: string) => {
    if (!preferences) return;
    const sizes = { ...(preferences.clothing_sizes || {}), [category]: size };
    await updatePreferences({ clothing_sizes: sizes });
  };

  const updateBudgetRange = async (min?: number, max?: number, currency?: string) => {
    await updatePreferences({ budget_range: { min, max, currency: currency || "INR" } });
  };

  return {
    preferences,
    loading,
    updatePreferences,
    addFavoriteSite,
    updateClothingSize,
    updateBudgetRange,
    refetch: fetchPreferences,
  };
};
