(function () {
  const config = window.SON_CONFIG || {};
  const keys = [
    "son-meme-exchange-posts",
    "son-meme-exchange-pending",
    "son-meme-exchange-votes",
    "son-meme-exchange-forums"
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
      data.forEach((row) => nativeSet(row.key, JSON.stringify(row.value)));
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
        data: { handle, display }
      }
    });
  }

  async function signIn({ email, password }) {
    if (!client) return { data: null, error: null, skipped: true };
    return client.auth.signInWithPassword({ email, password });
  }

  async function getUser() {
    if (!client) return null;
    const { data, error } = await client.auth.getUser();
    if (error) return null;
    return data.user || null;
  }

  window.SonBackend = {
    client,
    isConfigured: () => Boolean(client),
    ready: hydrate(),
    signUp,
    signIn,
    getUser
  };
})();
