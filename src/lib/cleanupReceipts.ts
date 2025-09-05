import { supabase } from "./supabaseClient";

export async function cleanupOldReceipts(userId: string, retentionDays = 90) {
  const BUCKET = "receipts";
  const MS = 24 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - retentionDays * MS);

  // Rekurencyjny listing: userId → expenseId → pliki
  async function listAllFiles(
    prefix: string
  ): Promise<{ path: string; created_at?: string }[]> {
    const out: { path: string; created_at?: string }[] = [];

    // listuje dany "katalog"
    async function list(prefixPart: string) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(prefixPart, {
          limit: 1000,
          sortBy: { column: "name", order: "asc" },
        });
      if (error) throw error;

      for (const entry of data ?? []) {
        // W Supabase Storage foldery mają id === null
        const isFolder = (entry as any).id === null;
        const full = prefixPart ? `${prefixPart}/${entry.name}` : entry.name;

        if (isFolder) {
          await list(full); // zejście poziom niżej
        } else {
          out.push({ path: full, created_at: (entry as any).created_at });
        }
      }
    }

    await list(prefix);
    return out;
  }

  // 1) Zbierz WSZYSTKIE pliki bieżącego użytkownika
  const files = await listAllFiles(userId);

  // 2) Odfiltruj starsze niż cutoff
  const toDelete = files.filter((f) => {
    const dt = f.created_at ? new Date(f.created_at) : null;
    return dt ? dt < cutoff : false;
  });

  if (toDelete.length === 0) return { deleted: 0 };

  // 3) Usuwaj w paczkach po 100; czyść też expenses.receipt_path/mime
  for (let i = 0; i < toDelete.length; i += 100) {
    const chunk = toDelete.slice(i, i + 100);
    const paths = chunk.map((c) => c.path);

    const { error: remErr } = await supabase.storage.from(BUCKET).remove(paths);
    if (remErr) {
      // Nie przerywaj całości, ale zaloguj
      console.warn("[cleanupOldReceipts] remove error:", remErr);
    }

    // Jeśli masz kolumny receipt_path/mime — wyczyść, ale tylko w swoich rekordach
    const { error: updErr } = await supabase
      .from("expenses")
      .update({ receipt_path: null, receipt_mime: null })
      .in("receipt_path", paths)
      .eq("user_id", userId);

    if (updErr) {
      console.warn("[cleanupOldReceipts] expenses update warn:", updErr);
    }
  }

  return { deleted: toDelete.length };
}
