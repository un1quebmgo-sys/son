const starterMemes = [
  { id: "starter-1", title: "songlasses", author: "@nuggeterrr5", credit: "image credit: @nuggeterrr5", caption: "son glasses moment. credit to @nuggeterrr5.", image: assetPath("assets/songlasses.png"), createdAt: 3, votes: 0 },
  { id: "starter-2", title: "Sony", author: "@nuggeterrr5", credit: "image credit: @nuggeterrr5", caption: "son became the console. credit to @nuggeterrr5.", image: assetPath("assets/sony.png"), createdAt: 2, votes: 0 },
  { id: "starter-3", title: "surgery", author: "@nuggeterrr5", credit: "image credit: @nuggeterrr5", caption: "the son operation. credit to @nuggeterrr5.", image: assetPath("assets/surgery.png"), createdAt: 1, votes: 0 }
];

const storageKey = "son-meme-exchange-posts";
const pendingKey = "son-meme-exchange-pending";
const voteKey = "son-meme-exchange-votes";
const forumKey = "son-meme-exchange-forums";
const deletedPostKey = "son-meme-exchange-deleted-posts";
const tradeKey = "son-meme-exchange-trades";
const tradeRequestKey = "son-meme-exchange-trade-requests";
const messagesKey = "son-meme-exchange-direct-messages";
const notificationKey = "son-meme-exchange-notifications";
const usersKey = "son-meme-exchange-users";
const currentUserKey = "son-meme-exchange-current-user";
const seedVersionKey = "son-meme-exchange-seed-version";
const seedVersion = "facebook-profiles-v4";
const appVersionKey = "son-meme-exchange-app-version";
const appVersion = "shared-trades-clean-ui-v6";
const adminEmail = "un1quebmgo@gmail.com";
const adminUserIds = new Set([
  "1fb0ffb1-fa06-4d10-874f-a1cf98fcd38e",
  "d1fb0ffb1-fa06-4d10-874f-a1cf98fcd38e"
]);

let selectedImage = "";
let activeProfileKey = "";
let activeThreadId = "";
let forumSort = "hot";
let verifiedAuthEmail = "";

function isCleanSubpage() { return window.location.pathname.endsWith("/") && window.location.pathname !== "/"; }
function routePath(path) { return `${isCleanSubpage() ? "../" : ""}${path}`; }
function assetPath(path) { return routePath(path); }

if (localStorage.getItem(seedVersionKey) !== seedVersion) {
  localStorage.removeItem(voteKey);
  localStorage.setItem(seedVersionKey, seedVersion);
}

if (localStorage.getItem(appVersionKey) !== appVersion) {
  localStorage.setItem(appVersionKey, appVersion);
  sessionStorage.clear();
  if ("caches" in window) caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
}

function loadJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function savePosts(posts) { localStorage.setItem(storageKey, JSON.stringify(posts)); }
function getPendingPosts() { return loadJson(pendingKey, []); }
function savePendingPosts(posts) { localStorage.setItem(pendingKey, JSON.stringify(posts)); }

function postFingerprint(post) {
  const raw = post.image ? String(post.image).trim().toLowerCase() : [post.title, post.author, post.caption].map(v => String(v || "").trim().toLowerCase()).join("|");
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  return String(hash);
}

function getRawPosts() {
  const synced = starterMemes.map(p => ({ ...p }));
  return [...loadJson(storageKey, []), ...synced].map((p, i) => ({ ...p, votes: getVoteCount(p.id), createdAt: Number(p.createdAt || String(p.id).replace("post-", "")) || i }));
}

function getPosts() {
  const deleted = getDeletedPostIds();
  const unique = new Map();
  getRawPosts().forEach(post => {
    const fp = postFingerprint(post);
    if (deleted[post.id] || deleted[`fp:${fp}`]) return;
    const current = unique.get(fp);
    if (!current || post.votes > current.votes || post.createdAt > current.createdAt) unique.set(fp, post);
  });
  return [...unique.values()];
}

function getVotes() { return loadJson(voteKey, {}); }
function saveVotes(votes) { localStorage.setItem(voteKey, JSON.stringify(votes)); }
function voterKey() {
  const user = getCurrentUser();
  return user?.id || user?.email?.toLowerCase() || user?.handle?.toLowerCase() || "";
}
function voteListFor(postId, votes = getVotes()) {
  const value = votes[postId];
  if (Array.isArray(value)) return value;
  if (value === true) return ["legacy-vote"];
  if (typeof value === "number") return Array.from({ length: Math.max(0, value) }, (_, i) => `legacy-${i}`);
  return [];
}
function getVoteCount(postId) { return voteListFor(postId).length; }
function hasUserVoted(postId) {
  const key = voterKey();
  return Boolean(key && voteListFor(postId).includes(key));
}
function getDeletedPostIds() { return loadJson(deletedPostKey, {}); }
function saveDeletedPostIds(ids) { localStorage.setItem(deletedPostKey, JSON.stringify(ids)); }
function getCurrentUser() { return loadJson(currentUserKey, null); }

function deletePost(postId) {
  if (!isAdminUser()) { showToast("admin only. 😭"); return; }
  const target = getRawPosts().find(post => post.id === postId);
  const deleted = getDeletedPostIds();
  deleted[postId] = true;
  if (target) deleted[`fp:${postFingerprint(target)}`] = true;
  saveDeletedPostIds(deleted);
  savePosts(loadJson(storageKey, []).filter(post => post.id !== postId && (!target || postFingerprint(post) !== postFingerprint(target))));
  const votes = getVotes();
  getRawPosts().filter(post => post.id === postId || (target && postFingerprint(post) === postFingerprint(target))).forEach(post => { delete votes[post.id]; });
  saveVotes(votes);
  showToast("deleted. 😭");
  renderPosts();
}

function setCurrentUser(user) {
  localStorage.setItem(currentUserKey, JSON.stringify(user));
  savePublicUserProfile(user);
  updateAdminVisibility();
  renderSignup();
}

function savePublicUserProfile(user) {
  if (!user?.handle) return;
  const users = getUsers();
  users[profileKey(user.handle)] = {
    handle: user.handle,
    email: user.email || "",
    display: user.display || "",
    pfp: user.pfp || "",
    updatedAt: Date.now()
  };
  if (user.email) users[user.email.toLowerCase()] = { ...users[profileKey(user.handle)], createdAt: user.createdAt || Date.now() };
  saveUsers(users);
}

function getPublicUserProfile(handle) {
  if (!handle) return null;
  return getUsers()[profileKey(handle)] || null;
}

function applyAvatar(el, author) {
  if (!el) return;
  const current = getCurrentUser();
  const profile = getPublicUserProfile(author) || (current?.handle && profileKey(current.handle) === profileKey(author || "") ? current : null);
  if (profile?.pfp) {
    el.textContent = "";
    el.style.backgroundImage = `url("${profile.pfp}")`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
  } else {
    el.style.backgroundImage = "";
    el.textContent = initialsFor(author || "@son");
  }
}

function isAdminUser(user) {
  const u = user || getCurrentUser();
  return Boolean((u?.email && u.email.toLowerCase() === adminEmail) || (u?.id && adminUserIds.has(String(u.id).toLowerCase())));
}

function updateAdminVisibility() {
  document.querySelectorAll('a[href="admin/"], a[href="../admin/"]').forEach(l => l.hidden = !isAdminUser());
}

function protectAdminPage() {
  const el = document.querySelector("#admin");
  if (!el || isAdminUser()) return;
  el.innerHTML = `<div class="admin-denied" role="alert"><p class="eyebrow">protected admin</p><h1 class="page-title">manual review is locked.</h1><p>Only ${adminEmail} can open the admin queue.</p><a class="view-link" href="${routePath("signup/")}">Sign in</a></div>`;
}

async function refreshVerifiedAuthUser() {
  if (!window.SonBackend?.isConfigured()) return null;
  const authUser = await window.SonBackend.getUser?.();
  if (authUser?.email) {
    verifiedAuthEmail = authUser.email.toLowerCase();
    const cur = getCurrentUser() || {};
    const meta = authUser.user_metadata || {};
    const user = { ...cur, id: authUser.id, handle: cur.handle || meta.handle || normalizeHandle(authUser.email.split("@")[0]), display: cur.display || meta.display || "", email: authUser.email };
    setCurrentUser(user);
    window.SonBackend.syncNow?.();
    const isOAuthReturn = window.location.hash.includes("access_token") || window.location.search.includes("code=") || window.location.hash.includes("error_description");
    if (isOAuthReturn) {
      window.setTimeout(() => {
        window.location.href = isAdminUser(user) ? routePath("admin/") : routePath("../");
      }, 300);
    }
  }
  return authUser;
}

function applyAuthUser(authUser, event) {
  if (!authUser?.email) return;
  verifiedAuthEmail = authUser.email.toLowerCase();
  const cur = getCurrentUser() || {};
  const meta = authUser.user_metadata || {};
  const user = { ...cur, id: authUser.id, handle: cur.handle || meta.handle || normalizeHandle(authUser.email.split("@")[0]), display: cur.display || meta.display || "", email: authUser.email };
  setCurrentUser(user);
  window.SonBackend.syncNow?.();
  renderPosts();
  renderNotifications();
  if (event === "SIGNED_IN") {
    window.setTimeout(() => {
      window.location.href = isAdminUser(user) ? routePath("admin/") : routePath("../");
    }, 300);
  }
}

function sanitizeText(v, fallback) { return v.trim().replace(/\s+/g, " ") || fallback; }
function normalizeHandle(v) { const c = sanitizeText(v, "@anonymous").replace(/\s+/g, "").replace(/^@*/, ""); return `@${c || "anonymous"}`; }

function totalVotesForAuthor(author) {
  if (!author) return 0;
  return getPosts().filter(p => profileKey(p.author) === profileKey(author)).reduce((s, p) => s + p.votes, 0);
}

function getTrades() { return loadJson(tradeKey, []); }
function saveTrades(t) { localStorage.setItem(tradeKey, JSON.stringify(t)); }
function getTradeRequests() { return loadJson(tradeRequestKey, []); }
function saveTradeRequests(r) { localStorage.setItem(tradeRequestKey, JSON.stringify(r)); }
function getMessages() { return loadJson(messagesKey, []); }
function saveMessages(m) { localStorage.setItem(messagesKey, JSON.stringify(m)); }
function getNotifications() { return loadJson(notificationKey, []); }
function saveNotifications(n) { localStorage.setItem(notificationKey, JSON.stringify(n)); }
function getUsers() { return loadJson(usersKey, {}); }
function saveUsers(u) { localStorage.setItem(usersKey, JSON.stringify(u)); }

function addNotification(notif) {
  const n = getNotifications();
  n.unshift(notif);
  saveNotifications(n);
}

function switchTradeTab(targetId) {
  document.querySelectorAll(".trade-page-tab").forEach(btn => btn.classList.toggle("is-active", btn.dataset.tradeTab === targetId));
  document.querySelectorAll(".trade-tab-panel").forEach(panel => panel.hidden = panel.id !== targetId);
  if (targetId === "trade-messages-panel") {
    initMessagingUI();
    renderNotifications();
    updateInboxCount();
  } else {
    renderTrades();
  }
}

function openMessagesInbox() {
  switchTradeTab("trade-messages-panel");
  const dmTab = document.querySelector('.inbox-tab-btn[data-inbox="dm-panel"]');
  if (dmTab) dmTab.click();
}

function openInboxConversation(participant) {
  if (!participant) { window.location.href = routePath("inbox/"); return; }
  const inboxList = document.querySelector("#notification-list");
  if (!inboxList) {
    window.location.href = routePath(`inbox/?dm=${encodeURIComponent(participant)}`);
    return;
  }
  initMessagingUI();
  const dmTab = document.querySelector('.inbox-tab-btn[data-inbox="dm-panel"]');
  if (dmTab) dmTab.click();
  const dm = getOrCreateDM(getCurrentUser()?.handle || "", participant);
  openDM(participant);
  dmChatView(participant, dm);
}

// ---------- SIGNUP / AUTH ----------

function renderSignup() {
  const status = document.querySelector("#signup-status");
  const status2 = document.querySelector("#signin-status");
  const accountPanel = document.querySelector("#account-panel");
  const authPanel = document.querySelector("#auth-panel");
  const user = getCurrentUser();
  const handleEl = document.querySelector("#account-handle");
  const emailEl = document.querySelector("#account-email");
  const signupUsername = document.querySelector("#signup-username");
  const signupEmail = document.querySelector("#signup-email");
  const signupDisplay = document.querySelector("#signup-display");
  const joinButton = document.querySelector(".join-button");
  const accountAvatar = document.querySelector("#account-avatar");
  const pfpPreview = document.querySelector("#account-pfp-preview");
  const pfpUrl = document.querySelector("#account-pfp-url");

  if (handleEl) handleEl.textContent = user?.handle || "@anonymous";
  if (emailEl) emailEl.textContent = user?.email ? `${user.email} · signed in` : "local profile";
  if (status) status.textContent = user ? `Signed in as ${user.handle}${user.display ? ` (${user.display})` : ""} · ${user.email || "no email"}.` : "Not signed in yet.";
  if (status2) status2.textContent = "Enter your email and password to sign in.";
  if (accountPanel) accountPanel.hidden = !user;
  if (authPanel) authPanel.hidden = !!user;
  if (signupUsername) signupUsername.value = user?.handle || "";
  if (signupEmail) signupEmail.value = user?.email || "";
  if (signupDisplay) signupDisplay.value = user?.display || "";
  if (accountAvatar) applyAvatar(accountAvatar, user?.handle || "@anonymous");
  if (pfpPreview) {
    pfpPreview.src = user?.pfp || assetPath("assets/logo.webp");
    pfpPreview.alt = user?.pfp ? `${user.handle} profile picture` : "profile picture preview";
  }
  if (pfpUrl) pfpUrl.value = user?.pfp || "";
  const memeAuthor = document.querySelector("#meme-author");
  if (memeAuthor) memeAuthor.value = user?.handle || "@anonymous -- sign up to change username";
  if (joinButton) {
    const badge = joinButton.querySelector(".inbox-badge");
    const label = user ? user.handle : "Sign up";
    joinButton.childNodes.forEach(node => { if (node.nodeType === Node.TEXT_NODE) node.textContent = ""; });
    joinButton.append(document.createTextNode(` ${label}`));
    if (badge) joinButton.append(badge);
  }
}

function updateStats(posts) {
  const h = posts.reduce((m, p) => Math.max(m, p.votes), 0);
  const sc = document.querySelector("#stat-count");
  const sv = document.querySelector("#stat-votes");
  const ts = document.querySelector("#top-score");
  if (sc) sc.textContent = `${posts.length} total sons`;
  if (sv) sv.textContent = `highest current vote: ${h}`;
  if (ts) ts.textContent = h;
}

// ---------- ADMIN ----------

function renderAdminQueue() {
  const al = document.querySelector("#admin-list");
  const pc = document.querySelector("#pending-count");
  const at = document.querySelector("#admin-card-template");
  if (!al || !pc || !at) return;
  if (!isAdminUser()) { protectAdminPage(); return; }
  const pending = getPendingPosts().sort((a, b) => b.createdAt - a.createdAt);
  pc.textContent = `${pending.length} pending`;
  al.replaceChildren();
  if (!pending.length) { const e = document.createElement("p"); e.className = "empty-state admin-empty"; e.textContent = "No sons waiting for review."; al.append(e); return; }
  pending.forEach(post => {
    const card = at.content.firstElementChild.cloneNode(true);
    card.querySelector("img").src = post.image;
    card.querySelector("img").alt = `${post.title} pending son`;
    card.querySelector("h3").textContent = post.title;
    card.querySelector("p").textContent = post.caption;
    card.querySelector("span").textContent = `uploaded by ${post.author}`;
    const msgBtn = card.querySelector(".message-uploader");
    if (msgBtn) {
      msgBtn.addEventListener("click", () => {
        const user = getCurrentUser();
        if (!user) { window.location.href = routePath("signup/"); return; }
        getOrCreateDM(user.handle, post.author);
        window.location.href = routePath("inbox/");
      });
    }
    card.querySelector(".accept-son").addEventListener("click", () => {
      const cp = getPendingPosts();
      const a = cp.find(i => i.id === post.id);
      if (!a) return;
      savePendingPosts(cp.filter(i => i.id !== post.id));
      savePosts([a, ...loadJson(storageKey, []).filter(item => postFingerprint(item) !== postFingerprint(a))]);
      renderPosts();
      renderAdminQueue();
    });
    card.querySelector(".reject-son").addEventListener("click", () => {
      savePendingPosts(getPendingPosts().filter(i => i.id !== post.id));
      renderAdminQueue();
    });
    al.append(card);
  });
}

function renderAdminFeed(posts = getPosts()) {
  const list = document.querySelector("#admin-feed-list");
  if (!list) return;
  if (!isAdminUser()) { protectAdminPage(); return; }
  list.replaceChildren();
  if (!posts.length) { const e = document.createElement("p"); e.className = "empty-state admin-empty"; e.textContent = "no live sons yet. 😭"; list.append(e); return; }
  posts.sort((a, b) => b.createdAt - a.createdAt).forEach(post => {
    const card = document.createElement("article");
    card.className = "admin-card";
    const img = document.createElement("img"); img.src = post.image; img.alt = `${post.title} live son`;
    const body = document.createElement("div");
    const title = document.createElement("h3"); title.textContent = post.title;
    const caption = document.createElement("p"); caption.textContent = post.caption;
    const meta = document.createElement("span"); meta.textContent = `${post.author} · ${post.votes} vote${post.votes === 1 ? "" : "s"}.`;
    body.append(title, caption, meta);
    const actions = document.createElement("div"); actions.className = "admin-actions";
    const message = document.createElement("button"); message.className = "ghost-light-button"; message.type = "button"; message.textContent = "Message user.";
    message.addEventListener("click", () => {
      const user = getCurrentUser();
      if (!user) { window.location.href = routePath("signup/"); return; }
      getOrCreateDM(user.handle, post.author);
      window.location.href = routePath("inbox/");
    });
    const remove = document.createElement("button"); remove.className = "ghost-light-button danger-button"; remove.type = "button"; remove.textContent = "Delete.";
    remove.addEventListener("click", () => deletePost(post.id));
    actions.append(message, remove);
    card.append(img, body, actions);
    list.append(card);
  });
}

// ---------- FORUMS ----------

function getThreads() {
  return loadJson(forumKey, []).map(t => ({ ...t, topic: t.topic || "general", votes: Number(t.votes || 0), messages: t.messages?.length ? t.messages : [{ id: `${t.id}-first`, author: t.author, body: t.body || "", createdAt: t.createdAt }] }));
}

function saveThreads(threads) { localStorage.setItem(forumKey, JSON.stringify(threads)); }

function renderForums() {
  const fl = document.querySelector("#forum-list");
  if (!fl) return;
  const user = getCurrentUser();
  const userVotes = totalVotesForAuthor(user?.handle);
  const canThread = userVotes >= 10;
  const tf = document.querySelector("#forum-topic-filter");
  const topicFilter = tf?.value || "all";
  const threads = getThreads().filter(t => topicFilter === "all" || t.topic === topicFilter).sort((a, b) => { if (forumSort === "new") return b.createdAt - a.createdAt; if (forumSort === "top") return b.votes - a.votes || b.messages.length - a.messages.length; return (b.votes * 3 + b.messages.length) - (a.votes * 3 + a.messages.length) || b.createdAt - a.createdAt; });
  const fg = document.querySelector("#forum-gate");
  const ff = document.querySelector("#forum-form");
  if (fg && ff) { fg.textContent = user ? `${user.handle} has ${userVotes}/10 upvotes needed to start a thread.` : "Sign up first, then earn 10 total upvotes to start a thread."; ff.classList.toggle("is-locked", !canThread); ff.querySelectorAll("input, textarea, button").forEach(f => f.disabled = !canThread); }
  fl.replaceChildren();
  if (!threads.length) { const e = document.createElement("p"); e.className = "empty-state forum-empty"; e.textContent = "No forum threads yet."; fl.append(e); return; }
  threads.forEach(t => {
    const card = document.createElement("article"); card.className = "forum-thread"; card.classList.toggle("is-active", t.id === activeThreadId);
    const vc = document.createElement("div"); vc.className = "thread-vote";
    const up = document.createElement("button"); up.type = "button"; up.textContent = "\u2191";
    const vs = document.createElement("strong"); vs.textContent = t.votes;
    const ct = document.createElement("button"); ct.className = "thread-content"; ct.type = "button";
    const tp = document.createElement("span"); tp.className = "thread-topic"; tp.textContent = t.topic;
    const ti = document.createElement("h3"); ti.textContent = t.title;
    const mt = document.createElement("span"); mt.textContent = `${t.author} \u00B7 ${t.messages.length} comment${t.messages.length === 1 ? "" : "s"}`;
    const bd = document.createElement("p"); bd.textContent = t.messages[t.messages.length - 1]?.body || "";
    vc.append(up, vs); ct.append(tp, ti, mt, bd); card.append(vc, ct);
    ct.addEventListener("click", () => { activeThreadId = t.id; renderForums(); });
    up.addEventListener("click", () => { const th = getThreads(); const f = th.find(i => i.id === t.id); if (!f) return; f.votes += 1; saveThreads(th); renderForums(); });
    fl.append(card);
  });
  if (!activeThreadId && threads[0]) activeThreadId = threads[0].id;
  renderMessages();
}

function renderMessages() {
  const mp = document.querySelector("#message-panel");
  const ml = document.querySelector("#message-list");
  const mtt = document.querySelector("#message-thread-title");
  const mtm = document.querySelector("#message-thread-meta");
  if (!mp || !ml) return;
  const thread = getThreads().find(i => i.id === activeThreadId);
  if (!thread) { mp.hidden = true; return; }
  mp.hidden = false;
  if (mtt) mtt.textContent = thread.title;
  if (mtm) mtm.textContent = `${thread.author} \u00B7 ${thread.topic} \u00B7 ${thread.votes} upvote${thread.votes === 1 ? "" : "s"} \u00B7 ${thread.messages.length} comment${thread.messages.length === 1 ? "" : "s"}`;
  ml.replaceChildren();
  thread.messages.sort((a, b) => a.createdAt - b.createdAt).forEach(m => {
    const item = document.createElement("article"); item.className = "message-item";
    const meta = document.createElement("span"); meta.textContent = `${m.author} \u00B7 ${new Date(m.createdAt).toLocaleString()}`;
    const body = document.createElement("p"); body.textContent = m.body;
    item.append(meta, body); ml.append(item);
  });
}

// ---------- PROFILES ----------

function profileKey(author) { return author.toLowerCase(); }

function profileListFromPosts(posts) {
  return posts.reduce((map, post) => {
    const key = profileKey(post.author);
    const cur = map.get(key) ?? { author: post.author, posts: [], votes: 0 };
    cur.posts.push(post); cur.votes += post.votes; map.set(key, cur); return map;
  }, new Map());
}

function initialsFor(name) { return name.replace(/^@/, "").split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase() || "SN"; }

function renderProfiles(posts) {
  const pg = document.querySelector("#profiles-grid");
  const pt = document.querySelector("#profile-card-template");
  if (!pg || !pt) return;
  const profiles = profileListFromPosts(posts);
  const sorted = [...profiles.values()].sort((a, b) => b.votes - a.votes || b.posts.length - a.posts.length || a.author.localeCompare(b.author));
  const top = sorted.slice(0, 3);
  if (!activeProfileKey && top[0]) activeProfileKey = profileKey(top[0].author);
  renderProfileDetail(profiles.get(activeProfileKey) ?? top[0]);
  pg.replaceChildren();
  top.forEach((profile, index) => {
    const card = pt.content.firstElementChild.cloneNode(true);
    const avatar = card.querySelector(".profile-avatar");
    applyAvatar(avatar, profile.author);
    avatar.setAttribute("data-rank", `#${index + 1}`);
    card.querySelector("h3").textContent = profile.author;
    card.querySelector("p").textContent = `${profile.posts.length} all-time son${profile.posts.length === 1 ? "" : "s"}`;
    card.querySelector(".profile-count").textContent = profile.posts.length;
    card.querySelector(".profile-votes").textContent = profile.votes;
    card.classList.toggle("is-active", profileKey(profile.author) === activeProfileKey);
    card.tabIndex = 0; card.setAttribute("role", "button"); card.setAttribute("aria-label", `View ${profile.author} profile`);
    const sons = card.querySelector(".profile-sons");
    profile.posts.sort((a, b) => b.votes - a.votes).forEach(post => {
      const row = document.createElement("a"); row.href = "#feed"; row.className = "profile-son-row";
      const img = document.createElement("img"); img.src = post.image; img.alt = "";
      const ti = document.createElement("span"); ti.textContent = post.title;
      const vo = document.createElement("strong"); vo.textContent = post.votes;
      row.append(img, ti, vo); sons.append(row);
    });
    pg.append(card);
    card.addEventListener("click", () => openProfile(profile.author));
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProfile(profile.author); } });
  });
}

function renderProfileDetail(profile) {
  const pd = document.querySelector("#profile-detail");
  if (!pd) return;
  if (!profile) { pd.hidden = true; return; }
  pd.hidden = false;
  const dn = document.querySelector("#profile-detail-name"); if (dn) dn.textContent = profile.author;
  const ds = document.querySelector("#profile-detail-summary"); if (ds) ds.textContent = `${profile.posts.length} uploaded son${profile.posts.length === 1 ? "" : "s"} in the archive`;
  const dc = document.querySelector("#profile-detail-count"); if (dc) dc.textContent = profile.posts.length;
  const dv = document.querySelector("#profile-detail-votes"); if (dv) dv.textContent = profile.votes;
  const da = document.querySelector(".profile-detail-avatar"); if (da) applyAvatar(da, profile.author);
  const g = document.querySelector("#profile-detail-gallery"); if (!g) return;
  g.replaceChildren();
  profile.posts.sort((a, b) => b.votes - a.votes).forEach(post => {
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "profile-gallery-item";
    const img = document.createElement("img"); img.src = post.image; img.alt = "";
    const lb = document.createElement("span"); lb.textContent = post.title;
    btn.append(img, lb);
    if (isAdminUser()) {
      const del = document.createElement("span");
      del.className = "admin-inline-delete";
      del.textContent = "Delete.";
      del.addEventListener("click", e => { e.stopPropagation(); deletePost(post.id); });
      btn.append(del);
    }
    btn.addEventListener("click", () => openViewer(post)); g.append(btn);
  });
}

function openProfile(author) {
  activeProfileKey = profileKey(author);
  const ps = document.querySelector("#search");
  if (!ps) { window.location.href = routePath(`search/?profile=${encodeURIComponent(author)}`); return; }
  renderProfiles(getPosts()); ps.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openViewer(post) {
  const v = document.querySelector("#meme-viewer");
  const vi = document.querySelector("#viewer-image");
  if (!v || !vi) { window.open(post.image, "_blank", "noopener"); return; }
  vi.src = post.image; vi.alt = `${post.title} meme image`; vi.hidden = false;
  const vt = document.querySelector("#viewer-title"); if (vt) vt.textContent = post.title;
  const va = document.querySelector("#viewer-author"); if (va) { va.textContent = post.author; va.onclick = () => { v.close(); openProfile(post.author); }; }
  const vc = document.querySelector("#viewer-caption"); if (vc) vc.textContent = post.caption;
  const vcr = document.querySelector("#viewer-credit"); if (vcr) vcr.textContent = post.credit || "uploaded image";
  const vd = document.querySelector("#viewer-download"); if (vd) vd.href = post.image;
  if (typeof v.showModal === "function") v.showModal();
}

function updateUploaderOptions(posts) {
  const gu = document.querySelector("#gallery-uploader");
  if (!gu) return;
  const cur = gu.value;
  const uploaders = [...new Set(posts.map(p => p.author))].sort((a, b) => a.localeCompare(b));
  gu.replaceChildren();
  const all = document.createElement("option"); all.value = "all"; all.textContent = "All uploaders"; gu.append(all);
  uploaders.forEach(u => { const o = document.createElement("option"); o.value = u; o.textContent = u; gu.append(o); });
  gu.value = uploaders.includes(cur) ? cur : "all";
}

// ---------- GALLERY ----------

function renderGallery(posts) {
  const gg = document.querySelector("#gallery-grid");
  const gt = document.querySelector("#gallery-card-template");
  const gs = document.querySelector("#gallery-search");
  const gst = document.querySelector("#gallery-sort");
  const gu = document.querySelector("#gallery-uploader");
  if (!gg || !gt || !gs || !gst || !gu) return;
  const query = gs.value.trim().toLowerCase();
  const uploader = gu.value;
  const sort = gst.value;
  const matches = posts.filter(p => uploader === "all" || p.author === uploader).filter(p => { if (!query) return true; return [p.title, p.author, p.caption, p.credit].join(" ").toLowerCase().includes(query); }).sort((a, b) => { if (sort === "votes") return b.votes - a.votes || b.createdAt - a.createdAt; if (sort === "title") return a.title.localeCompare(b.title); return b.createdAt - a.createdAt; });
  gg.replaceChildren();
  if (!matches.length) { const e = document.createElement("p"); e.className = "empty-state gallery-empty"; e.textContent = "No sons match that search yet."; gg.append(e); return; }
  matches.forEach(post => {
    const card = gt.content.firstElementChild.cloneNode(true);
    card.querySelector("img").src = post.image; card.querySelector("img").alt = `${post.title} meme image`;
    card.querySelector("h3").textContent = post.title;
    const au = card.querySelector(".author"); au.textContent = post.author; au.addEventListener("click", () => openProfile(post.author));
    card.querySelector("p").textContent = post.caption;
    card.querySelector(".gallery-votes").textContent = `${post.votes} vote${post.votes === 1 ? "" : "s"}`;
    card.querySelector(".card-download").href = post.image;
    const del = card.querySelector(".admin-delete-son");
    if (del) {
      del.hidden = !isAdminUser();
      del.addEventListener("click", e => { e.stopPropagation(); deletePost(post.id); });
    }
    card.querySelector(".gallery-view").addEventListener("click", () => openViewer(post));
    gg.append(card);
  });
}

// ---------- FEED ----------

function renderHeroBoard(posts) {
  const board = document.querySelector(".hero-board");
  if (!board) return;
  const top = [...posts].sort((a, b) => b.votes - a.votes || b.createdAt - a.createdAt).slice(0, 3);
  board.querySelectorAll(".stack-card").forEach((card, index) => {
    const post = top[index];
    if (!post) return;
    const img = card.querySelector("img");
    const link = card.querySelector("a");
    if (img) { img.src = post.image; img.alt = `${post.title} son image`; }
    if (link) { link.href = post.image; link.download = `${post.title || "son"}.png`; }
  });
}

function renderPosts() {
  const posts = getPosts();
  const sortedPosts = [...posts].sort((a, b) => b.votes - a.votes || b.createdAt - a.createdAt);
  const visiblePosts = sortedPosts.slice(0, 3);
  const votes = getVotes();
  renderHeroBoard(sortedPosts);
  const grid = document.querySelector("#meme-grid");
  const template = document.querySelector("#meme-card-template");
  if (grid && template) {
    grid.replaceChildren();
    if (!visiblePosts.length) { const e = document.createElement("p"); e.className = "empty-state"; e.textContent = "no top sons yet. 😭"; grid.append(e); }
    visiblePosts.forEach(post => {
      const card = template.content.firstElementChild.cloneNode(true);
      card.querySelector("img").src = post.image; card.querySelector("img").alt = `${post.title} meme image`;
      card.querySelector("h3").textContent = post.title;
      card.querySelector("p").textContent = post.caption;
      const au = card.querySelector(".author"); au.textContent = `uploaded by ${post.author}`; au.addEventListener("click", () => openProfile(post.author));
      card.querySelector(".image-credit").textContent = post.credit || "uploaded image";
      const vb = card.querySelector(".vote-button"); const vt = vb.querySelector("span"); vt.textContent = post.votes;
      vb.classList.toggle("is-voted", hasUserVoted(post.id)); vb.setAttribute("aria-label", `Upvote ${post.title}`);
      card.querySelector(".card-download").href = post.image;
      const msgBtn = document.createElement("button"); msgBtn.className = "ghost-light-button"; msgBtn.type = "button"; msgBtn.textContent = "Message."; msgBtn.style.cssText = "font-size:12px;padding:4px 10px";
      msgBtn.addEventListener("click", () => { if (!getCurrentUser()) { window.location.href = routePath("signup/"); return; } window.location.href = routePath(`inbox/?dm=${encodeURIComponent(post.author.replace(/^@+/, ""))}`); });
      const dl = card.querySelector(".card-download"); if (dl) dl.parentElement.insertBefore(msgBtn, dl);
      const del = card.querySelector(".admin-delete-son");
      if (del) {
        del.hidden = !isAdminUser();
        del.addEventListener("click", e => { e.stopPropagation(); deletePost(post.id); });
      }
      const viewBtn = card.querySelector(".view-pill"); viewBtn.addEventListener("click", () => openViewer(post));
      card.querySelector("img").addEventListener("click", () => openViewer(post));
      vb.addEventListener("click", () => {
        const userVote = voterKey();
        if (!userVote) { window.location.href = routePath("signup/"); return; }
        const nv = getVotes();
        const list = voteListFor(post.id, nv).filter(v => !String(v).startsWith("legacy-") && v !== "legacy-vote");
        nv[post.id] = list.includes(userVote) ? list.filter(v => v !== userVote) : [...list, userVote];
        saveVotes(nv); renderPosts();
      });
      grid.append(card);
    });
  }
  updateStats(posts); updateUploaderOptions(posts); renderGallery(posts); renderProfiles(posts); renderAdminQueue(); renderAdminFeed(posts); renderNotifications(); updateInboxCount();
}

// ---------- SUBMIT ----------

function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    selectedImage = reader.result;
    const pv = document.querySelector("#image-preview");
    const dz = document.querySelector("#drop-zone");
    if (pv) { pv.src = selectedImage; pv.alt = "Selected meme preview"; pv.hidden = false; }
    if (dz) dz.classList.add("has-preview");
  });
  reader.readAsDataURL(file);
}

// ---------- TRADING ----------

function renderTrades() {
  const tl = document.querySelector("#trade-list");
  const ts = document.querySelector("#trade-search");
  if (!tl) return;
  const query = ts?.value?.trim().toLowerCase() || "";
  const trades = getTrades().filter(t => !t.status || t.status === "open").filter(t => !query || [t.title, t.have, t.want, t.body, t.author].join(" ").toLowerCase().includes(query)).sort((a, b) => b.createdAt - a.createdAt);
  tl.replaceChildren();
  if (!trades.length) { const e = document.createElement("p"); e.className = "empty-state"; e.textContent = "No trade ads yet. 😭"; tl.append(e); return; }
  trades.forEach(trade => {
    const card = document.createElement("article"); card.className = "trade-card";
    const h3 = document.createElement("h3"); h3.textContent = trade.title;
    const p = document.createElement("p"); p.textContent = trade.body || "No details.";
    const ex = document.createElement("div"); ex.className = "trade-exchange";
    const have = document.createElement("span"); have.innerHTML = `<strong>HAVE</strong><br>${trade.have}`;
    const want = document.createElement("span"); want.innerHTML = `<strong>WANT</strong><br>${trade.want}`;
    ex.append(have, want);
    const meta = document.createElement("span"); meta.textContent = `${trade.author} \u00B7 ${new Date(trade.createdAt).toLocaleDateString()}`;
    const act = document.createElement("div"); act.className = "trade-actions";
    const chatBtn = document.createElement("button"); chatBtn.className = "primary-button"; chatBtn.textContent = "Message user.";
    chatBtn.addEventListener("click", () => openTradeChat(trade));
    act.append(chatBtn);
    card.append(h3, p, ex, meta, act);
    tl.append(card);
  });
}

function acceptTradeAd(trade, partnerHandle) {
  const user = getCurrentUser();
  if (!user || profileKey(user.handle) !== profileKey(trade.author)) {
    showToast("Only the trade ad owner can accept it.");
    return;
  }
  saveTrades(getTrades().map(t => t.id === trade.id ? { ...t, status: "accepted", acceptedBy: partnerHandle, acceptedAt: Date.now() } : t));
  addNotification({ id: `notif-${Date.now()}`, type: "trade_accepted", to: partnerHandle, from: user.handle, message: `${user.handle} accepted your trade request for "${trade.title}".`, read: false, createdAt: Date.now() });
  sendDM(partnerHandle, `Accepted the trade ad "${trade.title}".`);
  showToast("trade ad accepted and removed. 😭");
  renderTrades();
  renderNotifications();
  updateInboxCount();
  openInboxConversation(partnerHandle);
}

function openTradeChat(trade) {
  const user = getCurrentUser();
  if (!user) { window.location.href = routePath("signup/"); return; }
  const dm = getOrCreateDM(user.handle, trade.author);
  const alreadyHasTradeMsg = dm.messages.some(m => m.body.includes(`[trade: ${trade.id}]`));
  if (!alreadyHasTradeMsg && user.handle.toLowerCase() !== trade.author.toLowerCase()) {
    const intro = `Interested in your trade ad: "${trade.title}" - I have ${trade.have} and want ${trade.want}. [trade: ${trade.id}]`;
    sendDM(trade.author, intro);
  }
  openInboxConversation(trade.author);
}

// ---------- DIRECT MESSAGING ----------

function getOrCreateDM(participant1, participant2) {
  const parts = [participant1.toLowerCase(), participant2.toLowerCase()].sort();
  const msgs = getMessages();
  let dm = msgs.find(m => m.participants[0] === parts[0] && m.participants[1] === parts[1]);
  if (!dm) {
    dm = { id: `dm-${Date.now()}`, participants: parts, messages: [], createdAt: Date.now() };
    msgs.push(dm);
    saveMessages(msgs);
  }
  return dm;
}

function sendDM(toUser, body) {
  const user = getCurrentUser();
  if (!user) return;
  const dm = getOrCreateDM(user.handle, toUser);
  const msg = { id: `msg-${Date.now()}`, from: user.handle, body: sanitizeText(body, ""), createdAt: Date.now() };
  dm.messages.push(msg);
  const msgs = getMessages();
  const index = msgs.findIndex(m => m.id === dm.id);
  if (index >= 0) msgs[index] = dm;
  else msgs.push(dm);
  saveMessages(msgs);
  addNotification({ id: `notif-${Date.now()}`, type: "new_message", to: toUser, from: user.handle, dmId: dm.id, message: body.slice(0, 60), read: false, createdAt: Date.now() });
}

function openDM(participant) {
  const user = getCurrentUser();
  if (!user) { window.location.href = routePath("signup/"); return; }
  const dm = getOrCreateDM(user.handle, participant);
  renderDMPanel(dm);
}

function renderDMPanel(dm) {
  const mp = document.querySelector("#dm-message-panel");
  if (!mp) return;
  mp.hidden = false;
  const user = getCurrentUser();
  const other = dm.participants.find(p => p !== user?.handle?.toLowerCase()) || dm.participants[0];
  const title = mp.querySelector(".dm-thread-title");
  const list = mp.querySelector(".dm-message-list");
  const form = mp.querySelector(".dm-message-form");
  const input = mp.querySelector(".dm-message-input");
  if (title) title.textContent = `dm ${other}. 😭`;
  const tradeMatch = dm.messages.map(m => m.body.match(/\[trade: ([^\]]+)\]/)).find(Boolean);
  const linkedTrade = tradeMatch ? getTrades().find(t => t.id === tradeMatch[1] && (!t.status || t.status === "open")) : null;
  let accept = mp.querySelector(".dm-accept-trade");
  if (!accept && title?.parentElement) {
    accept = document.createElement("button");
    accept.className = "dm-accept-trade primary-button";
    accept.type = "button";
    title.parentElement.append(accept);
  }
  if (accept) {
    const canAccept = linkedTrade && profileKey(linkedTrade.author) === profileKey(user?.handle || "") && other;
    accept.hidden = !canAccept;
    accept.textContent = "Accept Trade Ad";
    accept.onclick = canAccept ? () => acceptTradeAd(linkedTrade, other) : null;
  }
  if (list) {
    list.replaceChildren();
    dm.messages.forEach(m => {
      const isMe = m.from.toLowerCase() === user?.handle?.toLowerCase();
      const item = document.createElement("div");
      item.style.cssText = `max-width:80%;padding:10px 14px;border-radius:8px;margin-bottom:4px;${isMe ? "margin-left:auto;background:#cbff49;color:#0a2138" : "margin-right:auto;background:#fff;border:1px solid var(--border);color:var(--ink)"}`;
      const meta = document.createElement("div"); meta.style.cssText = "font-size:11px;font-weight:700;margin-bottom:4px;opacity:0.7";
      meta.textContent = isMe ? "You" : m.from;
      const body = document.createElement("div"); body.style.cssText = "font-size:14px";
      body.textContent = m.body;
      item.append(meta, body); list.append(item);
    });
    list.scrollTop = list.scrollHeight;
  }
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!input?.value.trim()) return;
      sendDM(other, input.value);
      input.value = "";
      renderDMPanel(getOrCreateDM(user?.handle || "", other));
      renderNotifications();
      updateInboxCount();
    };
  }
}

function dmChatView(other, dm) {
  const panel = document.querySelector("#dm-message-panel");
  const list = document.querySelector("#dm-list");
  if (panel) renderDMPanel(dm || getOrCreateDM(getCurrentUser()?.handle || "", other));
  if (list) list.style.display = "none";
  const back = document.querySelector(".dm-back-btn");
  if (back) back.hidden = false;
}

function renderInbox() {
  const nl = document.querySelector("#notification-list");
  if (!nl) return;
  const user = getCurrentUser();
  if (!user) { nl.innerHTML = '<p class="empty-state">sign in to see inbox. 😭</p>'; return; }
  const userKey = profileKey(user.handle);
  const notifs = getNotifications().filter(n => n.to && profileKey(n.to) === userKey).sort((a, b) => b.createdAt - a.createdAt);
  nl.replaceChildren();
  if (!notifs.length) { const e = document.createElement("p"); e.className = "empty-state"; e.textContent = "no notifications yet. 😭"; nl.append(e); return; }
  notifs.forEach(n => {
    const card = document.createElement("article"); card.className = "notification-card"; card.classList.toggle("is-unread", !n.read);
    const h3 = document.createElement("h3");
    const type = String(n.type || "").replace(/-/g, "_");
    if (type === "trade_request") h3.textContent = "this is where you can trade. 😭";
    else if (n.type === "new_message") h3.textContent = `message from ${n.from}. 😭`;
    else if (n.type === "trade_accepted") h3.textContent = `trade ad accepted by ${n.from}. 😭`;
    else if (type.includes("trade")) h3.textContent = "this is where you can trade. 😭";
    else h3.textContent = `${n.type}.`;
    const p = document.createElement("p"); p.textContent = type.includes("trade") ? "this is where you can trade. 😭" : `${n.message || "new thing."}`;
    const span = document.createElement("span"); span.textContent = new Date(n.createdAt).toLocaleString();
    card.append(h3, p, span);
    card.addEventListener("click", () => {
      saveNotifications(getNotifications().map(item => item.id === n.id ? { ...item, read: true } : item));
      renderInbox();
      updateInboxCount();
      if ((type === "trade_accepted" || type === "new_message" || type.includes("trade")) && n.from) openInboxConversation(n.from);
    });
    nl.append(card);
  });
}

function renderDMs() {
  const dml = document.querySelector("#dm-list");
  if (!dml) return;
  const user = getCurrentUser();
  if (!user) { dml.innerHTML = '<p class="empty-state">Sign in to see your messages.</p>'; return; }
  const userHandle = user.handle.toLowerCase();
  const convos = getMessages().filter(m => m.participants.includes(userHandle)).sort((a, b) => {
    const lastA = a.messages[a.messages.length - 1]?.createdAt || a.createdAt;
    const lastB = b.messages[b.messages.length - 1]?.createdAt || b.createdAt;
    return lastB - lastA;
  });
  dml.replaceChildren();
  if (!convos.length) { const e = document.createElement("p"); e.className = "empty-state"; e.textContent = "No conversations yet. Start one from a trade or profile."; dml.append(e); return; }
  convos.forEach(dm => {
    const other = dm.participants.find(p => p !== userHandle) || dm.participants[0];
    const lastMsg = dm.messages[dm.messages.length - 1];
    const tradeMatch = lastMsg?.body?.match(/\[trade: ([^\]]+)\]/);
    const card = document.createElement("article"); card.className = "dm-convo-card";
    card.style.cssText = "display:grid;gap:4px;padding:14px;background:#fff;border:1px solid var(--border);border-radius:8px;cursor:pointer;transition:border-color .15s;color:var(--ink)";
    card.onmouseover = () => card.style.borderColor = "rgba(125,164,0,0.48)";
    card.onmouseout = () => card.style.borderColor = "var(--border)";
    const label = tradeMatch ? `trade ad with ${other}. 😭` : `dm ${other}. 😭`;
    const preview = lastMsg ? `${lastMsg.from === userHandle ? "You" : lastMsg.from}: ${lastMsg.body.replace(/\[trade: [^\]]+\]/, "").trim().slice(0, 60)}${lastMsg.body.length > 60 ? "..." : ""}` : "No messages yet";
    card.innerHTML = `<strong style="font-size:15px">${label}</strong><span style="color:var(--ink-soft);font-size:13px">${preview}</span>`;
    card.addEventListener("click", () => {
      openDM(other);
      dmChatView(other, dm);
      renderDMs();
    });
    dml.append(card);
  });
}

function updateInboxCount() {
  const user = getCurrentUser();
  if (!user) return;
  const userKey = profileKey(user.handle);
  const unread = getNotifications().filter(n => !n.read && n.to && profileKey(n.to) === userKey).length;
  const badges = document.querySelectorAll(".inbox-badge");
  badges.forEach(b => { b.textContent = unread; b.hidden = unread === 0; });
}

// ---------- NOTIFICATIONS ----------

function renderNotifications() {
  renderInbox();
  renderDMs();
}

// ---------- TOAST ----------

function showToast(msg) {
  let toast = document.querySelector(".son-toast");
  if (!toast) {
    toast = document.createElement("div"); toast.className = "son-toast"; document.body.append(toast);
  }
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toast._hide);
  toast._hide = setTimeout(() => toast.classList.remove("is-visible"), 3000);
}

// ---------- EVENT WIRING ----------

document.addEventListener("DOMContentLoaded", () => {
  // File upload
  const fi = document.querySelector("#meme-file");
  const dz = document.querySelector("#drop-zone");
  if (fi) fi.addEventListener("change", e => handleFile(e.target.files[0]));
  if (dz) {
    ["dragenter", "dragover"].forEach(n => dz.addEventListener(n, e => { e.preventDefault(); dz.classList.add("is-dragover"); }));
    ["dragleave", "drop"].forEach(n => dz.addEventListener(n, e => { e.preventDefault(); dz.classList.remove("is-dragover"); }));
    dz.addEventListener("drop", e => handleFile(e.dataTransfer.files[0]));
  }

  // Submit form
  const form = document.querySelector("#meme-form");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(form);
      const post = { id: `post-${Date.now()}`, title: sanitizeText(fd.get("meme-title"), "Untitled son meme"), author: normalizeHandle(fd.get("meme-author")), credit: "user upload", caption: sanitizeText(fd.get("meme-caption"), "No caption supplied."), image: selectedImage || assetPath("assets/songlasses.png"), createdAt: Date.now(), votes: 0 };
      savePosts([post, ...loadJson(storageKey, [])]);
      showToast("son is live. 😭");
      selectedImage = "";
      const pv = document.querySelector("#image-preview"); if (pv) { pv.removeAttribute("src"); pv.removeAttribute("alt"); pv.hidden = true; }
      if (dz) dz.classList.remove("has-preview"); form.reset(); renderPosts(); renderAdminQueue();
    });
  }

  // Clear local
  const cl = document.querySelector("#clear-local");
  if (cl) cl.addEventListener("click", () => { localStorage.removeItem(storageKey); localStorage.removeItem(pendingKey); localStorage.removeItem(voteKey); localStorage.removeItem(deletedPostKey); starterMemes[0].votes = 0; starterMemes[1].votes = 0; starterMemes[2].votes = 0; renderPosts(); renderAdminQueue(); });

  // Signup form
  const sf = document.querySelector("#signup-form");
  const ss = document.querySelector("#signup-status");
  if (sf) {
    sf.addEventListener("submit", async e => {
      e.preventDefault();
      const pw = document.querySelector("#signup-password")?.value || "";
      const cf = document.querySelector("#signup-confirm")?.value || "";
      if (pw.length < 8) { ss.textContent = "Password must be at least 8 characters."; return; }
      if (pw !== cf) { ss.textContent = "Passwords do not match."; return; }
      const terms = document.querySelector("#signup-terms");
      if (terms && !terms.checked) { ss.textContent = "You need to agree to the upload rules."; return; }
      const user = { handle: normalizeHandle(document.querySelector("#signup-username").value), email: sanitizeText(document.querySelector("#signup-email").value, ""), display: sanitizeText(document.querySelector("#signup-display").value, ""), passwordSet: true, createdAt: Date.now() };
      if (window.SonBackend?.isConfigured()) {
        ss.textContent = "Creating account...";
        let { data, error } = await window.SonBackend.signUp({ email: user.email, password: pw, handle: user.handle, display: user.display });
        if (error && /already|registered|exists/i.test(error.message)) { ss.textContent = "Signing in..."; const r = await window.SonBackend.signIn({ email: user.email, password: pw }); data = r.data; error = r.error; }
        if (!error && !data?.session) { const r = await window.SonBackend.signIn({ email: user.email, password: pw }); if (!r.error) data = r.data; }
        if (error) { ss.textContent = error.message; return; }
        verifiedAuthEmail = data?.user?.email?.toLowerCase() || "";
        await refreshVerifiedAuthUser();
      }
      setCurrentUser(user);
      document.querySelector("#signup-password").value = ""; if (document.querySelector("#signup-confirm")) document.querySelector("#signup-confirm").value = "";
      ss.textContent = isAdminUser(user) ? "Admin signed in. Redirecting..." : "Signed in.";
      window.setTimeout(() => window.location.href = isAdminUser(user) ? routePath("admin/") : routePath("../"), 500);
    });
  }

  // Signin form
  const sinf = document.querySelector("#signin-form");
  const sins = document.querySelector("#signin-status");
  if (sinf) {
    sinf.addEventListener("submit", async e => {
      e.preventDefault();
      const email = sanitizeText(document.querySelector("#signin-email").value, "");
      const pw = document.querySelector("#signin-password").value || "";
      if (!email || !pw) { sins.textContent = "Email and password required."; return; }
      if (window.SonBackend?.isConfigured()) {
        sins.textContent = "Signing in...";
        const { data, error } = await window.SonBackend.signIn({ email, password: pw });
        if (error) { sins.textContent = error.message; return; }
        verifiedAuthEmail = data?.user?.email?.toLowerCase() || "";
        await refreshVerifiedAuthUser();
      } else {
        const users = getUsers();
        if (!users[email]) { sins.textContent = "No account found with that email."; return; }
        setCurrentUser({ handle: users[email].handle, email, display: users[email].display || "", passwordSet: true, createdAt: users[email].createdAt });
      }
      document.querySelector("#signin-password").value = "";
      sins.textContent = "Signed in.";
      window.setTimeout(() => window.location.href = routePath("../"), 400);
    });
  }

  // Reset password
  const rp = document.querySelector("#reset-password-button");
  if (rp) rp.addEventListener("click", () => {
    const tabs = document.querySelectorAll(".auth-tab-panel");
    tabs.forEach(t => t.hidden = true);
    const r = document.querySelector("#tab-reset"); if (r) r.hidden = false;
  });

  const prf = document.querySelector("#password-reset-form");
  const prs = document.querySelector("#password-reset-status");
  if (prf) {
    prf.addEventListener("submit", async e => {
      e.preventDefault();
      const np = document.querySelector("#reset-new-password").value;
      const cp = document.querySelector("#reset-confirm-password").value;
      if (np.length < 8) { prs.textContent = "Password must be at least 8 characters."; return; }
      if (np !== cp) { prs.textContent = "Passwords do not match."; return; }
      if (window.SonBackend?.isConfigured()) {
        const { error } = await window.SonBackend.updatePassword(np);
        if (error) { prs.textContent = error.message; return; }
      }
      prs.textContent = "Password updated successfully!";
      window.setTimeout(() => window.location.href = routePath("../"), 500);
    });
  }

  // Auth tabs
  document.querySelectorAll(".auth-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab-btn").forEach(b => b.classList.remove("is-active"));
      document.querySelectorAll(".auth-tab-panel").forEach(p => p.hidden = true);
      btn.classList.add("is-active");
      const panel = document.querySelector(`#${btn.dataset.auth}`);
      if (panel) panel.hidden = false;
    });
  });

  // Google sign in
  const gb = document.querySelector("#google-login-button");
  if (gb) {
    gb.addEventListener("click", async () => {
      if (!window.SonBackend?.isConfigured()) { showToast("Supabase not configured."); return; }
      const { data, error } = await window.SonBackend.signInWithGoogle();
      if (error) { showToast(error.message); return; }
      if (data?.url) window.location.href = data.url;
    });
  }

  // Sign out
  const so = document.querySelector("#signout-button");
  if (so) {
    so.addEventListener("click", async () => {
      if (window.SonBackend?.isConfigured()) await window.SonBackend.signOut();
      localStorage.removeItem(currentUserKey); verifiedAuthEmail = "";
      renderSignup(); updateAdminVisibility(); location.reload();
    });
  }

  // Account form
  const pfpFile = document.querySelector("#account-pfp-file");
  if (pfpFile) {
    pfpFile.addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const pfpUrl = document.querySelector("#account-pfp-url");
        const preview = document.querySelector("#account-pfp-preview");
        if (pfpUrl) pfpUrl.value = reader.result;
        if (preview) preview.src = reader.result;
      });
      reader.readAsDataURL(file);
    });
  }

  const af = document.querySelector("#account-form");
  if (af) {
    af.addEventListener("submit", e => {
      e.preventDefault();
      const user = getCurrentUser();
      if (!user) return;
      user.display = sanitizeText(document.querySelector("#account-display").value, "");
      user.pfp = sanitizeText(document.querySelector("#account-pfp-url")?.value || "", "");
      setCurrentUser(user);
      const st = document.querySelector("#account-status"); if (st) st.textContent = "Settings saved.";
      renderSignup();
    });
  }

  // Forum form
  const ff = document.querySelector("#forum-form");
  if (ff) {
    ff.addEventListener("submit", e => {
      e.preventDefault();
      const user = getCurrentUser();
      if (!user || totalVotesForAuthor(user?.handle) < 10) { renderForums(); return; }
      const body = sanitizeText(document.querySelector("#forum-body").value, "No post body.");
      const thread = { id: `thread-${Date.now()}`, title: sanitizeText(document.querySelector("#forum-title").value, "Untitled thread"), topic: document.querySelector("#forum-topic")?.value || "general", body, author: user.handle, createdAt: Date.now(), votes: 0, messages: [{ id: `message-${Date.now()}`, author: user.handle, body, createdAt: Date.now() }] };
      saveThreads([thread, ...getThreads()]); activeThreadId = thread.id; ff.reset(); renderForums();
    });
  }

  // Message form (forums)
  const mf = document.querySelector("#message-form");
  const mb = document.querySelector("#message-body");
  if (mf) {
    mf.addEventListener("submit", e => {
      e.preventDefault();
      const user = getCurrentUser();
      const threads = getThreads();
      const thread = threads.find(i => i.id === activeThreadId);
      if (!thread) return;
      thread.messages.push({ id: `message-${Date.now()}`, author: user?.handle || "@guest", body: sanitizeText(mb.value, "No message."), createdAt: Date.now() });
      saveThreads(threads); mf.reset(); renderForums();
    });
  }

  // Forum sort buttons
  document.querySelectorAll(".forum-sort-button").forEach(btn => {
    btn.addEventListener("click", () => { forumSort = btn.dataset.sort; document.querySelectorAll(".forum-sort-button").forEach(b => b.classList.toggle("is-active", b === btn)); renderForums(); });
  });

  const ftf = document.querySelector("#forum-topic-filter");
  if (ftf) ftf.addEventListener("change", renderForums);

  // Viewer close
  const vc = document.querySelector(".viewer-close");
  const vi = document.querySelector("#viewer-image");
  if (vc) vc.addEventListener("click", () => { if (vi) { vi.hidden = true; vi.removeAttribute("src"); } const v = document.querySelector("#meme-viewer"); if (v && typeof v.close === "function") v.close(); });

  // Gallery controls
  ["gallery-search", "gallery-sort", "gallery-uploader"].forEach(id => {
    const el = document.querySelector(`#${id}`);
    if (el) { el.addEventListener("input", () => renderGallery(getPosts())); el.addEventListener("change", () => renderGallery(getPosts())); }
  });

  // Trade form
  const tf = document.querySelector("#trade-form");
  if (tf) {
    tf.addEventListener("submit", e => {
      e.preventDefault();
      const user = getCurrentUser();
      if (!user) { window.location.href = routePath("signup/"); return; }
      const fd = new FormData(tf);
      const trade = { id: `trade-${Date.now()}`, title: sanitizeText(fd.get("trade-title"), "Trade"), have: sanitizeText(fd.get("trade-have"), ""), want: sanitizeText(fd.get("trade-want"), ""), body: sanitizeText(fd.get("trade-body"), ""), author: user.handle, createdAt: Date.now(), status: "open" };
      saveTrades([trade, ...getTrades()]); tf.reset(); renderTrades(); showToast("Trade ad posted! 😭");
    });
  }

  // Trade search
  const ts = document.querySelector("#trade-search");
  if (ts) { ts.addEventListener("input", renderTrades); ts.addEventListener("change", renderTrades); }

  document.querySelectorAll(".trade-page-tab").forEach(btn => {
    btn.addEventListener("click", () => switchTradeTab(btn.dataset.tradeTab));
  });

  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.toggle("is-active", b === btn));
      document.querySelectorAll(".admin-tab-panel").forEach(panel => { panel.hidden = panel.id !== btn.dataset.tab; });
      renderAdminFeed();
    });
  });

  // Trade inbox button
  const tib = document.querySelector("#trade-inbox-btn");
  if (tib) tib.addEventListener("click", () => switchTradeTab("trade-messages-panel"));

  // Weapon X easter egg
  const wx = document.querySelector(".weapon-x-trigger");
  if (wx) {
    let count = 0;
    wx.addEventListener("click", () => { count++; if (count >= 3) { document.body.classList.toggle("weapon-x-mode"); count = 0; } });
  }

  // Init trading and DM sections on signup page
  initMessagingUI();
});

function initMessagingUI() {
  const nl = document.querySelector("#notification-list");
  if (!nl) return;

  const parent = nl.parentElement;
  if (parent && !document.querySelector(".inbox-tabs")) {
    const tabs = document.createElement("nav"); tabs.className = "inbox-tabs";
    tabs.style.cssText = "display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid var(--border);padding-bottom:0";
    tabs.innerHTML = `
      <button class="inbox-tab-btn is-active" data-inbox="notification-list" style="background:none;border:none;padding:10px 20px;font-size:15px;font-weight:600;color:var(--ink);cursor:pointer;border-bottom:2px solid #cbff49;margin-bottom:-2px">Notifications.</button>
      <button class="inbox-tab-btn" data-inbox="dm-panel" style="background:none;border:none;padding:10px 20px;font-size:15px;font-weight:600;color:var(--ink-soft);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px">Messages.</button>`;
    parent.insertBefore(tabs, nl);

    const dmPanel = document.createElement("div"); dmPanel.id = "dm-panel"; dmPanel.hidden = true;
    dmPanel.innerHTML = `<button class="dm-back-btn" hidden style="margin-bottom:10px;padding:8px 12px;background:#fff;border:1px solid var(--border);border-radius:6px;color:var(--ink);font-weight:700;cursor:pointer;font-size:13px">\u2190 Back to conversations.</button><div id="dm-list"></div><div id="dm-message-panel" hidden><div class="message-head" style="display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid var(--border)"><h2 class="dm-thread-title" style="margin:0;font-size:clamp(1.1rem,2vw,1.5rem);color:var(--ink)"></h2></div><div class="message-list dm-message-list" style="max-height:360px;overflow:auto;padding-right:4px;margin-top:10px"></div><form class="dm-message-form" style="display:grid;gap:8px;margin-top:12px;border-top:1px solid var(--border);padding-top:12px"><textarea class="dm-message-input" placeholder="Type a message..." maxlength="500" style="width:100%;min-height:50px;padding:10px 12px;background:#fff;border:1px solid var(--border);border-radius:6px;color:var(--ink);resize:vertical;font:inherit"></textarea><button class="primary-button" type="submit" style="align-self:flex-end">Send.</button></form></div>`;
    parent.insertBefore(dmPanel, nl.nextSibling);

    const dmList = dmPanel.querySelector("#dm-list");
    const dmMsgPanel = dmPanel.querySelector("#dm-message-panel");
    const backBtn = dmPanel.querySelector(".dm-back-btn");

    backBtn.addEventListener("click", () => {
      dmList.style.display = "";
      dmMsgPanel.hidden = true;
      backBtn.hidden = true;
      renderDMs();
    });

    dmPanel.querySelector(".dm-message-form").addEventListener("submit", e => {
      e.preventDefault();
      const user = getCurrentUser();
      if (!user) return;
      const input = dmPanel.querySelector(".dm-message-input");
      if (!input?.value.trim()) return;
      const titleEl = dmPanel.querySelector(".dm-thread-title");
      const other = titleEl?.textContent?.replace(/^dm\s+/, "").replace(/\. 😭$/, "") || "";
      sendDM(other, input.value); input.value = "";
      renderDMPanel(getOrCreateDM(user.handle, other));
      renderNotifications(); updateInboxCount();
    });

    tabs.querySelectorAll(".inbox-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        tabs.querySelectorAll(".inbox-tab-btn").forEach(b => { b.classList.toggle("is-active", b === btn); b.style.borderBottomColor = b === btn ? "#cbff49" : "transparent"; b.style.color = b === btn ? "var(--ink)" : "var(--ink-soft)"; });
        const target = document.querySelector(`#${btn.dataset.inbox}`);
        nl.hidden = target !== nl;
        if (dmPanel) dmPanel.hidden = target !== dmPanel;
        if (target === dmPanel) { dmList.style.display = ""; dmMsgPanel.hidden = true; backBtn.hidden = true; renderDMs(); }
        if (target === nl) renderInbox();
      });
    });
  }
}

// ---------- BOOT ----------

async function boot() {
  const params = new URLSearchParams(window.location.search);
  const profileParam = params.get("profile");
  const dmParam = params.get("dm");
  if (profileParam) activeProfileKey = profileKey(profileParam);
  updateAdminVisibility();
  protectAdminPage();
  renderPosts();
  renderSignup();
  renderForums();
  renderTrades();
  renderNotifications();
  updateInboxCount();
  if (dmParam && getCurrentUser()) openInboxConversation(dmParam);
  await refreshVerifiedAuthUser();
  updateAdminVisibility();
  protectAdminPage();
  renderPosts();
  renderSignup();
  renderTrades();
  renderNotifications();
  updateInboxCount();
  if (dmParam && getCurrentUser()) openInboxConversation(dmParam);
}

if (window.SonBackend?.onAuthStateChange) {
  window.SonBackend.onAuthStateChange((user, event) => {
    applyAuthUser(user, event);
    updateAdminVisibility();
    protectAdminPage();
  });
}

boot();
if (window.SonBackend?.ready) {
  window.SonBackend.ready.finally(() => {
    renderPosts();
    renderSignup();
    renderTrades();
    renderNotifications();
    updateInboxCount();
  });
}
