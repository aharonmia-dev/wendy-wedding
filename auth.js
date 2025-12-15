// js/auth.js
window.getUser = async function () {
  const { data, error } = await supabaseClient.auth.getUser();
  if (error) console.warn("getUser error:", error);
  return data?.user ?? null;
};

window.signUp = async function (email, password) {
  clearMsg();
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

window.signIn = async function (email, password) {
  clearMsg();
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

window.signOut = async function () {
  clearMsg();
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
};
