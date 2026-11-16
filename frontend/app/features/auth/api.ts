import { clearLoggedInMark, markLoggedIn } from "~/lib/session";
import { supabase } from "~/lib/supabase";

type Result = { error: string | null; needsConfirm?: boolean };

export const signIn = async (email: string, password: string): Promise<Result> => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  markLoggedIn();
  return { error: null };
};

export const signUp = async (email: string, password: string): Promise<Result> => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  if (!data.session) return { error: null, needsConfirm: true };
  markLoggedIn();
  return { error: null };
};

export const signOut = async () => {
  await supabase.auth.signOut();
  clearLoggedInMark();
};
