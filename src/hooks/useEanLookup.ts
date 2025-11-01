import { useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useEanLookup() {
  const lookupByEan = useCallback(async (ean: string) => {
    const { data, error } = await supabase
      .from("product_catalog")
      .select("ean,name,category")
      .eq("ean", ean)
      .maybeSingle();

    if (error) throw error;
    return data as {
      ean: string;
      name: string;
      category: string | null;
    } | null;
  }, []);

  const upsertCatalog = useCallback(
    async (ean: string, name: string, category?: string | null) => {
      const payload = {
        ean,
        name,
        category: category || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("product_catalog").upsert(payload, {
        onConflict: "ean",
      });
      if (error) throw error;
    },
    []
  );

  return { lookupByEan, upsertCatalog };
}
