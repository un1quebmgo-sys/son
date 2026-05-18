(function () {
  const config = window.SON_CONFIG || {};
  const keys = [
    "son-meme-exchange-posts",
    "son-meme-exchange-pending",
    "son-meme-exchange-votes",
    "son-meme-exchange-forums",
    "son-meme-exchange-trades",
    "son-meme-exchange-trade-requests",
    "son-meme-exchange-trade-request-quota",
    "son-meme-exchange-deleted-posts",
    "son-meme-exchange-notifications",
    "son-meme-exchange-direct-messages",
    "son-meme-exchange-users",
    "son-meme-exchange-forum-unlock",
    "son-meme-exchange-banned"
  ];
  const privateKeys = [
    "son-meme-exchange-current-user",
    "son-meme-exchange-seed-version"
  ];
  const nativeSet = localStorage.setItem.bind(localStorage);
  const nativeRemove = localStorage.removeItem.bind(localStorage);
  const configured = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  const client = configured
    ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
    : null;

  async function persist(key, rawValue) {
    if (!client || privateKeys.includes(key) || !keys.includes(key)) return;
    try {
      const value = JSON.parse(rawValue);
      await client.from("app_state").upsert({ key, value, updated_at: new Date().toISOString() });
    } catch (error) {
      console.warn("Supabase sync failed:", error.message);
    }
  }

  async function removeRemote(key) {
    if (!client || privateKeys.includes(key) || !keys.includes(key)) return;
    try {
      await client.from("app_state").delete().eq("key", key);
    } catch (error) {
      console.warn("Supabase delete failed:", error.message);
    }
  }

  function mergeById(localValue, remoteValue) {
    if (!Array.isArray(localValue)) return remoteValue;
    if (!Array.isArray(remoteValue)) return localValue;
    const merged = new Map();
    [...remoteValue, ...localValue].forEach((item) => {
      if (!item || typeof item !== "object" || !item.id) return;
      const existing = merged.get(item.id);
      const itemTime = Number(item.updatedAt || item.createdAt || item.acceptedAt || 0);
      const existingTime = Number(existing?.updatedAt || existing?.createdAt || existing?.acceptedAt || 0);
      merged.set(item.id, !existing || itemTime >= existingTime ? item : existing);
    });
    return [...merged.values()];
  }

  function mergeVotes(localValue, remoteValue) {
    const out = { ...(remoteValue && typeof remoteValue === "object" ? remoteValue : {}) };
    if (!localValue || typeof localValue !== "object") return out;
    Object.entries(localValue).forEach(([postId, votes]) => {
      const remoteVotes = Array.isArray(out[postId]) ? out[postId] : [];
      const localVotes = Array.isArray(votes) ? votes : votes === true ? ["legacy-vote"] : [];
      out[postId] = [...new Set([...remoteVotes, ...localVotes])];
    });
    return out;
  }

  function mergeState(key, remoteValue) {
    let localValue = null;
    try { localValue = JSON.parse(localStorage.getItem(key)); } catch { localValue = null; }
    if (key === "son-meme-exchange-votes") return mergeVotes(localValue, remoteValue);
    if (localValue && remoteValue && !Array.isArray(localValue) && !Array.isArray(remoteValue) && typeof localValue === "object" && typeof remoteValue === "object") {
      return { ...remoteValue, ...localValue };
    }
    if (Array.isArray(localValue) || Array.isArray(remoteValue)) return mergeById(localValue, remoteValue);
    return remoteValue ?? localValue;
  }

  localStorage.setItem = function (key, value) {
    nativeSet(key, value);
    persist(key, value);
  };

  localStorage.removeItem = function (key) {
    nativeRemove(key);
    removeRemote(key);
  };

  async function hydrate() {
    if (!client) return;
    try {
      const { data, error } = await client.from("app_state").select("key,value").in("key", keys);
      if (error) throw error;
      data.forEach((row) => nativeSet(row.key, JSON.stringify(mergeState(row.key, row.value))));
    } catch (error) {
      console.warn("Supabase hydrate failed, using local data:", error.message);
    }
  }

  async function signUp({ email, password, handle, display }) {
    if (!client) return { data: null, error: null, skipped: true };
    return client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/signup/`,
        data: { handle, display }
      }
    });
  }

  async function signIn({ email, password }) {
    if (!client) return { data: null, error: null, skipped: true };
    return client.auth.signInWithPassword({ email, password });
  }

  async function signInWithGoogle() {
    if (!client) return { data: null, error: null, skipped: true };
    return client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/signup/`,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: "offline",
          prompt: "select_account"
        }
      }
    });
  }

  async function getUser() {
    if (!client) return null;
    const { data, error } = await client.auth.getUser();
    if (error) return null;
    return data.user || null;
  }

  async function syncNow() {
    if (!client) return;
    await Promise.all(keys.map((key) => {
      const raw = localStorage.getItem(key);
      return raw == null ? Promise.resolve() : persist(key, raw);
    }));
  }

  function onAuthStateChange(callback) {
    if (!client) return { data: null, error: null, skipped: true };
    return client.auth.onAuthStateChange((_event, session) => callback(session?.user || null));
  }

  async function signOut() {
    if (!client) return { error: null, skipped: true };
    return client.auth.signOut();
  }

  async function resetPassword(email) {
    if (!client) return { data: null, error: null, skipped: true };
    return client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/signup/`
    });
  }

  async function updatePassword(password) {
    if (!client) return { data: null, error: null, skipped: true };
    return client.auth.updateUser({ password });
  }

  window.SonBackend = {
    client,
    isConfigured: () => Boolean(client),
    ready: hydrate(),
    signUp,
    signIn,
    signInWithGoogle,
    syncNow,
    resetPassword,
    updatePassword,
    getUser,
    onAuthStateChange,
    signOut
  };
})();
