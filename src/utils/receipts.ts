import { supabase } from "../lib/supabaseClient";

export async function uploadExpenseReceipt(
  expenseId: string,
  file: File,
  userId: string
) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const name =
    (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) + "." + ext;
  const path = `${userId}/${expenseId}/${name}`;

  const { error: upErr } = await supabase.storage
    .from("receipts")
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
  if (upErr) throw upErr;

  const { error: updErr } = await supabase
    .from("expenses")
    .update({ receipt_path: path, receipt_mime: file.type || null })
    .eq("id", expenseId);
  if (updErr) throw updErr;

  return path;
}

export async function getReceiptSignedUrl(path: string, seconds = 300) {
  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}
