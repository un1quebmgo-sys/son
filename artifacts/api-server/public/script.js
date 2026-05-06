const starterMemes = [
  {
    id: "starter-1",
    title: "songlasses",
    author: "@nuggeterrr5",
    credit: "image credit: @nuggeterrr5",
    caption: "son glasses moment. credit to @nuggeterrr5.",
    image: assetPath("assets/songlasses.png"),
    createdAt: 3,
    votes: 0
  },
  {
    id: "starter-2",
    title: "Sony",
    author: "@nuggeterrr5",
    credit: "image credit: @nuggeterrr5",
    caption: "son became the console. credit to @nuggeterrr5.",
    image: assetPath("assets/sony.png"),
    createdAt: 2,
    votes: 0
  },
  {
    id: "starter-3",
    title: "surgery",
    author: "@nuggeterrr5",
    credit: "image credit: @nuggeterrr5",
    caption: "the son operation. credit to @nuggeterrr5.",
    image: assetPath("assets/surgery.png"),
    createdAt: 1,
    votes: 0
  }
];

const storageKey = "son-meme-exchange-posts";
const pendingKey = "son-meme-exchange-pending";
const voteKey = "son-meme-exchange-votes";
const forumKey = "son-meme-exchange-forums";
const currentUserKey = "son-meme-exchange-current-user";
const seedVersionKey = "son-meme-exchange-seed-version";
const seedVersion = "facebook-profiles-v4";
const adminEmail = "un1quebmgo@gmail.com";
const forumUnlockKey = "son-meme-exchange-forum-unlock";
const bannedKey = "son-meme-exchange-banned";

const form = document.querySelector("#meme-form");
const signupForm = document.querySelector("#signup-form");
const signupUsername = document.querySelector("#signup-username");
const signupEmail = document.querySelector("#signup-email");
const signupDisplay = document.querySelector("#signup-display");
const signupPassword = document.querySelector("#signup-password");
const signupConfirm = document.querySelector("#signup-confirm");
const signupTerms = document.querySelector("#signup-terms");
const signupStatus = document.querySelector("#signup-status");
const forumForm = document.querySelector("#forum-form");
const forumList = document.querySelector("#forum-list");
const forumGate = document.querySelector("#forum-gate");
const forumTopic = document.querySelector("#forum-topic");
const forumTopicFilter = document.querySelector("#forum-topic-filter");
const forumSortButtons = [...document.querySelectorAll(".forum-sort-button")];
const messagePanel = document.querySelector("#message-panel");
const messageThreadTitle = document.querySelector("#message-thread-title");
const messageThreadMeta = document.querySelector("#message-thread-meta");
const messageList = document.querySelector("#message-list");
const messageForm = document.querySelector("#message-form");
const messageBody = document.querySelector("#message-body");
const adminList = document.querySelector("#admin-list");
const pendingCount = document.querySelector("#pending-count");
const adminTemplate = document.querySelector("#admin-card-template");
const fileInput = document.querySelector("#meme-file");
const dropZone = document.querySelector("#drop-zone");
const preview = document.querySelector("#image-preview");
const grid = document.querySelector("#meme-grid");
const template = document.querySelector("#meme-card-template");
const galleryGrid = document.querySelector("#gallery-grid");
const galleryTemplate = document.querySelector("#gallery-card-template");
const gallerySearch = document.querySelector("#gallery-search");
const gallerySort = document.querySelector("#gallery-sort");
const galleryUploader = document.querySelector("#gallery-uploader");
const profilesGrid = document.querySelector("#profiles-grid");
const profileTemplate = document.querySelector("#profile-card-template");
const profileDetail = document.querySelector("#profile-detail");
const viewer = document.querySelector("#meme-viewer");
const viewerImage = document.querySelector("#viewer-image");
const viewerTitle = document.querySelector("#viewer-title");
const viewerAuthor = document.querySelector("#viewer-author");
const viewerCaption = document.querySelector("#viewer-caption");
const viewerCredit = document.querySelector("#viewer-credit");
const viewerDownload = document.querySelector("#viewer-download");
const clearLocalButton = document.querySelector("#clear-local");
const statCount = document.querySelector("#stat-count");
const statVotes = document.querySelector("#stat-votes");
const topScore = document.querySelector("#top-score");

let selectedImage = "";
let activeProfileKey = "";
let activeThreadId = "";
let forumSort = "hot";
let verifiedAuthEmail = "";

function isCleanSubpage() {
  return window.location.pathname.endsWith("/") && window.location.pathname !== "/";
}

function routePath(path) {
  return `${isCleanSubpage() ? "../" : ""}${path}`;
}

function assetPath(path) {
  return routePath(path);
}

if (localStorage.getItem(seedVersionKey) !== seedVersion) {
  localStorage.removeItem(voteKey);
  localStorage.setItem(seedVersionKey, seedVersion);
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function savePosts(posts) {
  localStorage.setItem(storageKey, JSON.stringify(posts));
}

function getPendingPosts() {
  return loadJson(pendingKey, []);
}

function savePendingPosts(posts) {
  localStorage.setItem(pendingKey, JSON.stringify(posts));
}

function getPosts() {
  const votes = getVotes();
  const syncedStarterMemes = starterMemes.map((post) => ({
    ...post,
    votes: votes[post.id] ? 1 : 0
  }));
  return [...loadJson(storageKey, []), ...syncedStarterMemes].map((post, index) => ({
    ...post,
    createdAt: Number(post.createdAt || String(post.id).replace("post-", "")) || index
  }));
}

function getVotes() {
  return loadJson(voteKey, {});
}

function saveVotes(votes) {
  localStorage.setItem(voteKey, JSON.stringify(votes));
}

function getForumUnlocked() {
  return loadJson(forumUnlockKey, []);
}

function saveForumUnlocked(list) {
  localStorage.setItem(forumUnlockKey, JSON.stringify(list));
}

function getBanned() {
  return loadJson(bannedKey, []);
}

function saveBanned(list) {
  localStorage.setItem(bannedKey, JSON.stringify(list));
}

function getCurrentUser() {
  return loadJson(currentUserKey, null);
}

function setCurrentUser(user) {
  localStorage.setItem(currentUserKey, JSON.stringify(user));
  updateAdminVisibility();
}

function isAdminUser(user = getCurrentUser()) {
  if (verifiedAuthEmail) return verifiedAuthEmail === adminEmail;
  return Boolean(user?.email && user.email.toLowerCase() === adminEmail);
}

function updateAdminVisibility() {
  const adminLinks = document.querySelectorAll('a[href="admin/"], a[href="../admin/"]');
  adminLinks.forEach((link) => {
    link.hidden = !isAdminUser();
  });
}

function protectAdminPage() {
  const adminSection = document.querySelector("#admin");
  if (!adminSection || isAdminUser()) return;

  adminSection.innerHTML = `
    <div class="admin-denied" role="alert">
      <p class="eyebrow">protected admin</p>
      <h1 class="page-title">admin only. 😭</h1>
      <p>You need admin access to view this page. Sign in with your admin account.</p>
      <a class="view-link" href="${routePath("signup/")}">Sign in</a>
    </div>
  `;

  window.setTimeout(() => {
    if (!isAdminUser()) window.location.href = routePath("signup/");
  }, 1500);
}

function showToast(message) {
  const existing = document.querySelector(".son-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "son-toast";
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => toast.classList.add("is-visible"), 10);
  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

async function refreshVerifiedAuthUser() {
  if (!window.SonBackend?.isConfigured()) return null;
  const authUser = await window.SonBackend.getUser?.();
  verifiedAuthEmail = authUser?.email?.toLowerCase() || "";
  if (authUser?.email) {
    const current = getCurrentUser() || {};
    const metadata = authUser.user_metadata || {};
    localStorage.setItem(currentUserKey, JSON.stringify({
      ...current,
      handle: current.handle || metadata.handle || normalizeHandle(authUser.email.split("@")[0]),
      display: current.display || metadata.display || "",
      email: authUser.email
    }));
  }
  return authUser;
}

function sanitizeText(value, fallback) {
  return value.trim().replace(/\s+/g, " ") || fallback;
}

function normalizeHandle(value) {
  const cleaned = sanitizeText(value, "@anonymous").replace(/\s+/g, "").replace(/^@*/, "");
  return `@${cleaned || "anonymous"}`;
}

function totalVotesForAuthor(author) {
  if (!author) return 0;
  return getPosts()
    .filter((post) => profileKey(post.author) === profileKey(author))
    .reduce((sum, post) => sum + post.votes, 0);
}

function renderSignup() {
  if (!signupStatus) return;
  const user = getCurrentUser();
  if (!user) {
    signupStatus.textContent = "Not signed in yet.";
    return;
  }
  signupStatus.textContent = `Signed in as ${user.handle}${user.display ? ` (${user.display})` : ""} · ${user.email || "no email"}.`;
  if (signupUsername) signupUsername.value = user.handle;
  if (signupEmail) signupEmail.value = user.email || "";
  if (signupDisplay) signupDisplay.value = user.display || "";
  const memeAuthor = document.querySelector("#meme-author");
  if (memeAuthor) memeAuthor.value = user.handle;
}

function updateStats(posts) {
  const highest = posts.reduce((max, post) => Math.max(max, post.votes), 0);
  if (statCount) statCount.textContent = `${posts.length} total sons`;
  if (statVotes) statVotes.textContent = `highest current vote: ${highest}`;
  if (topScore) topScore.textContent = highest;
}

function renderAdminQueue() {
  if (!adminList || !pendingCount || !adminTemplate) return;
  if (!isAdminUser()) {
    protectAdminPage();
    return;
  }
  const pending = getPendingPosts().sort((a, b) => b.createdAt - a.createdAt);
  pendingCount.textContent = `${pending.length} pending`;
  adminList.replaceChildren();

  if (!pending.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state admin-empty";
    empty.textContent = "No sons waiting for review.";
    adminList.append(empty);
    return;
  }

  pending.forEach((post) => {
    const card = adminTemplate.content.firstElementChild.cloneNode(true);
    const image = card.querySelector("img");
    const title = card.querySelector("h3");
    const caption = card.querySelector("p");
    const meta = card.querySelector("span");
    const accept = card.querySelector(".accept-son");
    const reject = card.querySelector(".reject-son");

    image.src = post.image;
    image.alt = `${post.title} pending son`;
    title.textContent = post.title;
    caption.textContent = post.caption;
    meta.textContent = `uploaded by ${post.author}`;

    accept.addEventListener("click", () => {
      if (!isAdminUser()) return;
      const currentPending = getPendingPosts();
      const accepted = currentPending.find((item) => item.id === post.id);
      if (!accepted) return;
      savePendingPosts(currentPending.filter((item) => item.id !== post.id));
      savePosts([accepted, ...loadJson(storageKey, [])]);
      renderPosts();
      renderAdminQueue();
    });

    reject.addEventListener("click", () => {
      if (!isAdminUser()) return;
      savePendingPosts(getPendingPosts().filter((item) => item.id !== post.id));
      renderAdminQueue();
    });

    adminList.append(card);
  });
}

function renderForums() {
  if (!forumList) return;
  const user = getCurrentUser();
  const userVotes = totalVotesForAuthor(user?.handle);
  const canThread = userVotes >= 10;
  const topicFilter = forumTopicFilter?.value || "all";
  const threads = loadJson(forumKey, [])
    .map((thread) => ({
      ...thread,
      topic: thread.topic || "general",
      votes: Number(thread.votes || 0),
      messages: thread.messages?.length ? thread.messages : [{
        id: `${thread.id}-first`,
        author: thread.author,
        body: thread.body || "",
        createdAt: thread.createdAt
      }]
    }))
    .filter((thread) => topicFilter === "all" || thread.topic === topicFilter)
    .sort((a, b) => {
      if (forumSort === "new") return b.createdAt - a.createdAt;
      if (forumSort === "top") return b.votes - a.votes || b.messages.length - a.messages.length;
      return (b.votes * 3 + b.messages.length) - (a.votes * 3 + a.messages.length) || b.createdAt - a.createdAt;
    });

  const banned = getBanned();
  const unlocked = getForumUnlocked();
  const isBanned = user && banned.includes(profileKey(user.handle));
  const canThread = !isBanned && (isAdminUser() || unlocked.includes(profileKey(user?.handle || "")) || userVotes >= 10);

  if (forumGate && forumForm) {
    forumGate.textContent = user
      ? isBanned
        ? `${user.handle} is banned from the forums.`
        : isAdminUser()
          ? `Admin access — posting unlocked.`
          : unlocked.includes(profileKey(user.handle))
            ? `${user.handle} has admin-granted forum access. 😭`
            : `${user.handle} has ${userVotes}/10 upvotes needed to start a thread.`
      : "Sign up first, then earn 10 total upvotes to start a thread.";
    forumForm.classList.toggle("is-locked", !canThread);
    forumForm.querySelectorAll("input, textarea, button").forEach((field) => {
      field.disabled = !canThread;
    });
  }

  forumList.replaceChildren();

  if (!threads.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state forum-empty";
    empty.textContent = "No forum threads yet.";
    forumList.append(empty);
    return;
  }

  threads.forEach((thread) => {
    const card = document.createElement("article");
    const voteColumn = document.createElement("div");
    const upvote = document.createElement("button");
    const voteScore = document.createElement("strong");
    const content = document.createElement("button");
    const topic = document.createElement("span");
    const title = document.createElement("h3");
    const meta = document.createElement("span");
    const body = document.createElement("p");
    card.className = "forum-thread";
    card.classList.toggle("is-active", thread.id === activeThreadId);
    voteColumn.className = "thread-vote";
    upvote.type = "button";
    upvote.textContent = "↑";
    voteScore.textContent = thread.votes;
    content.className = "thread-content";
    content.type = "button";
    topic.className = "thread-topic";
    topic.textContent = thread.topic;
    title.textContent = thread.title;
    meta.textContent = `${thread.author} · ${thread.messages.length} comment${thread.messages.length === 1 ? "" : "s"}`;
    body.textContent = thread.messages[thread.messages.length - 1]?.body || "";
    voteColumn.append(upvote, voteScore);
    content.append(topic, title, meta, body);
    card.append(voteColumn, content);
    content.addEventListener("click", () => openThread(thread.id));
    upvote.addEventListener("click", () => voteThread(thread.id));
    forumList.append(card);
  });

  if (!activeThreadId && threads[0]) activeThreadId = threads[0].id;
  renderMessages();
}

function getThreads() {
  return loadJson(forumKey, []).map((thread) => ({
    ...thread,
    topic: thread.topic || "general",
    votes: Number(thread.votes || 0),
    messages: thread.messages?.length ? thread.messages : [{
      id: `${thread.id}-first`,
      author: thread.author,
      body: thread.body || "",
      createdAt: thread.createdAt
    }]
  }));
}

function saveThreads(threads) {
  localStorage.setItem(forumKey, JSON.stringify(threads));
}

function openThread(id) {
  activeThreadId = id;
  renderForums();
}

function voteThread(id) {
  const threads = getThreads();
  const thread = threads.find((item) => item.id === id);
  if (!thread) return;
  thread.votes += 1;
  saveThreads(threads);
  renderForums();
}

function renderMessages() {
  if (!messagePanel || !messageList) return;
  const thread = getThreads().find((item) => item.id === activeThreadId);

  if (!thread) {
    messagePanel.hidden = true;
    return;
  }

  messagePanel.hidden = false;
  messageThreadTitle.textContent = thread.title;
  messageThreadMeta.textContent = `${thread.author} · ${thread.topic} · ${thread.votes} upvote${thread.votes === 1 ? "" : "s"} · ${thread.messages.length} comment${thread.messages.length === 1 ? "" : "s"}`;
  messageList.replaceChildren();

  thread.messages
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach((message) => {
      const item = document.createElement("article");
      const meta = document.createElement("span");
      const body = document.createElement("p");
      item.className = "message-item";
      meta.textContent = `${message.author} · ${new Date(message.createdAt).toLocaleString()}`;
      body.textContent = message.body;
      item.append(meta, body);
      messageList.append(item);
    });
}

function profileKey(author) {
  return author.toLowerCase();
}

function profileListFromPosts(posts) {
  return posts.reduce((map, post) => {
    const key = profileKey(post.author);
    const current = map.get(key) ?? {
      author: post.author,
      posts: [],
      votes: 0
    };
    current.posts.push(post);
    current.votes += post.votes;
    map.set(key, current);
    return map;
  }, new Map());
}

function initialsFor(name) {
  return name
    .replace(/^@/, "")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SN";
}

function renderProfiles(posts) {
  if (!profilesGrid || !profileTemplate) return;
  const profiles = profileListFromPosts(posts);
  const sortedProfiles = [...profiles.values()]
    .sort((a, b) => b.votes - a.votes || b.posts.length - a.posts.length || a.author.localeCompare(b.author));
  const topProfiles = sortedProfiles.slice(0, 3);

  if (!activeProfileKey && topProfiles[0]) {
    activeProfileKey = profileKey(topProfiles[0].author);
  }

  renderProfileDetail(profiles.get(activeProfileKey) ?? topProfiles[0]);
  profilesGrid.replaceChildren();

  topProfiles.forEach((profile, index) => {
    const card = profileTemplate.content.firstElementChild.cloneNode(true);
    const avatar = card.querySelector(".profile-avatar");
    const title = card.querySelector("h3");
    const subtext = card.querySelector("p");
    const count = card.querySelector(".profile-count");
    const votes = card.querySelector(".profile-votes");
    const sons = card.querySelector(".profile-sons");

    avatar.textContent = initialsFor(profile.author);
    avatar.setAttribute("data-rank", `#${index + 1}`);
    title.textContent = profile.author;
    subtext.textContent = `${profile.posts.length} all-time son${profile.posts.length === 1 ? "" : "s"}`;
    count.textContent = profile.posts.length;
    votes.textContent = profile.votes;
    card.classList.toggle("is-active", profileKey(profile.author) === activeProfileKey);
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `View ${profile.author} profile`);

    profile.posts
      .sort((a, b) => b.votes - a.votes)
      .forEach((post) => {
        const row = document.createElement("a");
        const image = document.createElement("img");
        const title = document.createElement("span");
        const votes = document.createElement("strong");

        row.href = "#feed";
        row.className = "profile-son-row";
        image.src = post.image;
        image.alt = "";
        title.textContent = post.title;
        votes.textContent = post.votes;

        row.append(image, title, votes);
        sons.append(row);
      });

    profilesGrid.append(card);

    card.addEventListener("click", () => openProfile(profile.author));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openProfile(profile.author);
      }
    });
  });
}

function renderProfileDetail(profile) {
  if (!profileDetail) return;
  if (!profile) {
    profileDetail.hidden = true;
    return;
  }

  profileDetail.hidden = false;
  document.querySelector("#profile-detail-name").textContent = profile.author;
  document.querySelector("#profile-detail-summary").textContent = `${profile.posts.length} uploaded son${profile.posts.length === 1 ? "" : "s"} in the archive`;
  document.querySelector("#profile-detail-count").textContent = profile.posts.length;
  document.querySelector("#profile-detail-votes").textContent = profile.votes;
  document.querySelector(".profile-detail-avatar").textContent = initialsFor(profile.author);

  const gallery = document.querySelector("#profile-detail-gallery");
  gallery.replaceChildren();

  profile.posts
    .sort((a, b) => b.votes - a.votes)
    .forEach((post) => {
      const button = document.createElement("button");
      const image = document.createElement("img");
      const label = document.createElement("span");

      button.type = "button";
      button.className = "profile-gallery-item";
      image.src = post.image;
      image.alt = "";
      label.textContent = post.title;
      button.append(image, label);
      button.addEventListener("click", () => openViewer(post));
      gallery.append(button);
    });
}

function openProfile(author) {
  activeProfileKey = profileKey(author);
  const profilesSection = document.querySelector("#profiles");
  if (!profilesSection) {
    window.location.href = routePath("#profiles");
    return;
  }
  renderProfiles(getPosts());
  profilesSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openViewer(post) {
  if (!viewer || !viewerImage) {
    window.open(post.image, "_blank", "noopener");
    return;
  }
  viewerImage.src = post.image;
  viewerImage.alt = `${post.title} meme image`;
  viewerImage.hidden = false;
  viewerTitle.textContent = post.title;
  viewerAuthor.textContent = post.author;
  viewerAuthor.onclick = () => {
    viewer.close();
    openProfile(post.author);
  };
  viewerCaption.textContent = post.caption;
  viewerCredit.textContent = post.credit || "uploaded image";
  viewerDownload.href = post.image;

  if (typeof viewer.showModal === "function") {
    viewer.showModal();
  }
}

function updateUploaderOptions(posts) {
  if (!galleryUploader) return;
  const current = galleryUploader.value;
  const uploaders = [...new Set(posts.map((post) => post.author))]
    .sort((a, b) => a.localeCompare(b));

  galleryUploader.replaceChildren();

  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "All uploaders";
  galleryUploader.append(all);

  uploaders.forEach((uploader) => {
    const option = document.createElement("option");
    option.value = uploader;
    option.textContent = uploader;
    galleryUploader.append(option);
  });

  galleryUploader.value = uploaders.includes(current) ? current : "all";
}

function renderGallery(posts) {
  if (!galleryGrid || !galleryTemplate || !gallerySearch || !gallerySort || !galleryUploader) return;
  const query = gallerySearch.value.trim().toLowerCase();
  const uploader = galleryUploader.value;
  const sort = gallerySort.value;

  const matches = posts
    .filter((post) => uploader === "all" || post.author === uploader)
    .filter((post) => {
      if (!query) return true;
      return [post.title, post.author, post.caption, post.credit]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => {
      if (sort === "votes") return b.votes - a.votes || b.createdAt - a.createdAt;
      if (sort === "title") return a.title.localeCompare(b.title);
      return b.createdAt - a.createdAt;
    });

  galleryGrid.replaceChildren();

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state gallery-empty";
    empty.textContent = "No sons match that search yet.";
    galleryGrid.append(empty);
    return;
  }

  matches.forEach((post) => {
    const card = galleryTemplate.content.firstElementChild.cloneNode(true);
    const image = card.querySelector("img");
    const view = card.querySelector(".gallery-view");
    const title = card.querySelector("h3");
    const author = card.querySelector(".author");
    const caption = card.querySelector("p");
    const votes = card.querySelector(".gallery-votes");
    const download = card.querySelector(".card-download");

    image.src = post.image;
    image.alt = `${post.title} meme image`;
    title.textContent = post.title;
    author.textContent = post.author;
    caption.textContent = post.caption;
    votes.textContent = `${post.votes} vote${post.votes === 1 ? "" : "s"}`;
    download.href = post.image;

    view.addEventListener("click", () => openViewer(post));
    author.addEventListener("click", () => openProfile(post.author));

    galleryGrid.append(card);
  });
}

function renderPosts() {
  const posts = getPosts();
  const visiblePosts = posts.sort((a, b) => b.votes - a.votes);
  const votes = getVotes();

  if (grid && template) {
    grid.replaceChildren();

    if (!visiblePosts.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Nothing in this lane yet. Submit the first one.";
      grid.append(empty);
    }

    visiblePosts.forEach((post) => {
      const card = template.content.firstElementChild.cloneNode(true);
      const image = card.querySelector("img");
      const title = card.querySelector("h3");
      const caption = card.querySelector("p");
      const viewButton = card.querySelector(".view-pill");
      const author = card.querySelector(".author");
      const voteButton = card.querySelector(".vote-button");
      const voteTotal = voteButton.querySelector("span");
      const download = card.querySelector(".card-download");
      const credit = card.querySelector(".image-credit");

      image.src = post.image;
      image.alt = `${post.title} meme image`;
      title.textContent = post.title;
      caption.textContent = post.caption;
      author.textContent = `uploaded by ${post.author}`;
      author.addEventListener("click", () => openProfile(post.author));
      credit.textContent = post.credit || "uploaded image";
      voteTotal.textContent = post.votes;
      voteButton.classList.toggle("is-voted", Boolean(votes[post.id]));
      voteButton.setAttribute("aria-label", `Upvote ${post.title}`);
      download.href = post.image;
      download.setAttribute("aria-label", `Download ${post.title}`);
      viewButton.addEventListener("click", () => openViewer(post));
      image.addEventListener("click", () => openViewer(post));

      voteButton.addEventListener("click", () => {
        const userPosts = loadJson(storageKey, []);
        const allEditablePosts = [...userPosts, ...starterMemes.map((item) => ({ ...item }))];
        const selected = allEditablePosts.find((item) => item.id === post.id);
        const nextVotes = getVotes();

        if (!selected) return;

        if (nextVotes[post.id]) {
          selected.votes -= 1;
          delete nextVotes[post.id];
        } else {
          selected.votes += 1;
          nextVotes[post.id] = true;
        }

        if (post.id.startsWith("starter-")) {
          const starter = starterMemes.find((item) => item.id === post.id);
          starter.votes = selected.votes;
        } else {
          savePosts(allEditablePosts.filter((item) => !item.id.startsWith("starter-")));
        }

        saveVotes(nextVotes);
        renderPosts();
      });

      grid.append(card);
    });
  }

  updateStats(posts);
  updateUploaderOptions(posts);
  renderGallery(posts);
  renderProfiles(posts);
  renderAdminQueue();
}

function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    selectedImage = reader.result;
    preview.src = selectedImage;
    preview.alt = "Selected meme preview";
    preview.hidden = false;
    dropZone.classList.add("has-preview");
  });
  reader.readAsDataURL(file);
}

if (fileInput) {
  fileInput.addEventListener("change", (event) => {
    handleFile(event.target.files[0]);
  });
}

if (dropZone) {
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("is-dragover");
    });
  });

  dropZone.addEventListener("drop", (event) => {
    handleFile(event.dataTransfer.files[0]);
  });
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const post = {
      id: `post-${Date.now()}`,
      title: sanitizeText(formData.get("meme-title"), "Untitled son meme"),
      author: normalizeHandle(formData.get("meme-author")),
      credit: "user upload",
      caption: sanitizeText(formData.get("meme-caption"), "No caption supplied."),
      image: selectedImage || assetPath("assets/songlasses.png"),
      createdAt: Date.now(),
      votes: 0
    };

    savePendingPosts([post, ...getPendingPosts()]);
    selectedImage = "";
    if (preview) {
      preview.removeAttribute("src");
      preview.removeAttribute("alt");
      preview.hidden = true;
    }
    if (dropZone) dropZone.classList.remove("has-preview");
    form.reset();
    renderSignup();
    renderAdminQueue();
    showToast("son submitted! 😭 awaiting admin review.");
    document.querySelector("#feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (clearLocalButton) {
  clearLocalButton.addEventListener("click", () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(pendingKey);
    localStorage.removeItem(voteKey);
    starterMemes[0].votes = 0;
    starterMemes[1].votes = 0;
    starterMemes[2].votes = 0;
    renderPosts();
    renderAdminQueue();
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = signupPassword?.value || "";
    const confirm = signupConfirm?.value || "";

    if (password.length < 8) {
      signupStatus.textContent = "Password must be at least 8 characters.";
      return;
    }

    if (password !== confirm) {
      signupStatus.textContent = "Passwords do not match.";
      return;
    }

    if (signupTerms && !signupTerms.checked) {
      signupStatus.textContent = "You need to agree to the upload rules.";
      return;
    }

    const user = {
      handle: normalizeHandle(signupUsername.value),
      email: sanitizeText(signupEmail.value, ""),
      display: sanitizeText(signupDisplay.value, ""),
      passwordSet: true,
      createdAt: Date.now()
    };

    if (window.SonBackend?.isConfigured()) {
      signupStatus.textContent = "Creating account...";
      let { data, error } = await window.SonBackend.signUp({
        email: user.email,
        password,
        handle: user.handle,
        display: user.display
      });

      if (error && /already|registered|exists/i.test(error.message)) {
        signupStatus.textContent = "Signing in...";
        const result = await window.SonBackend.signIn({ email: user.email, password });
        data = result.data;
        error = result.error;
      }

      if (!error && !data?.session) {
        const result = await window.SonBackend.signIn({ email: user.email, password });
        if (!result.error) data = result.data;
      }

      if (error) {
        signupStatus.textContent = error.message;
        return;
      }

      verifiedAuthEmail = data?.user?.email?.toLowerCase() || "";
      await refreshVerifiedAuthUser();
    }

    setCurrentUser(user);
    if (signupPassword) signupPassword.value = "";
    if (signupConfirm) signupConfirm.value = "";
    signupStatus.textContent = isAdminUser(user)
      ? "Admin signed in. Redirecting to review queue..."
      : "Signed in. Redirecting to uploads...";
    window.setTimeout(() => {
      window.location.href = isAdminUser(user) ? routePath("admin/") : routePath("#submit");
    }, 500);
  });
}

if (forumForm) {
  forumForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    const userVotes = totalVotesForAuthor(user?.handle);
    const unlockedList = getForumUnlocked();
    const bannedList = getBanned();
    const userKey = profileKey(user?.handle || "");
    const canPost = user && !bannedList.includes(userKey) && (isAdminUser() || unlockedList.includes(userKey) || userVotes >= 10);
    if (!canPost) {
      renderForums();
      return;
    }
    const body = sanitizeText(document.querySelector("#forum-body").value, "No post body.");
    const thread = {
      id: `thread-${Date.now()}`,
      title: sanitizeText(document.querySelector("#forum-title").value, "Untitled thread"),
      topic: forumTopic?.value || "general",
      body,
      author: user.handle,
      createdAt: Date.now(),
      votes: 0,
      messages: [{
        id: `message-${Date.now()}`,
        author: user.handle,
        body,
        createdAt: Date.now()
      }]
    };
    saveThreads([thread, ...getThreads()]);
    activeThreadId = thread.id;
    forumForm.reset();
    renderForums();
  });
}

if (messageForm) {
  messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    const threads = getThreads();
    const thread = threads.find((item) => item.id === activeThreadId);
    if (!thread) return;

    thread.messages.push({
      id: `message-${Date.now()}`,
      author: user?.handle || "@guest",
      body: sanitizeText(messageBody.value, "No message."),
      createdAt: Date.now()
    });

    saveThreads(threads);
    messageForm.reset();
    renderForums();
  });
}

forumSortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    forumSort = button.dataset.sort;
    forumSortButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderForums();
  });
});

if (forumTopicFilter) {
  forumTopicFilter.addEventListener("change", renderForums);
}

const viewerClose = document.querySelector(".viewer-close");
if (viewerClose) {
  viewerClose.addEventListener("click", () => {
    viewerImage.hidden = true;
    viewerImage.removeAttribute("src");
    viewer.close();
  });
}

[gallerySearch, gallerySort, galleryUploader].filter(Boolean).forEach((control) => {
  control.addEventListener("input", () => renderGallery(getPosts()));
  control.addEventListener("change", () => renderGallery(getPosts()));
});

function renderAdminLiveFeed() {
  const list = document.querySelector("#admin-feed-list");
  if (!list) return;
  const posts = loadJson(storageKey, []);
  list.replaceChildren();

  if (!posts.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state admin-empty";
    empty.textContent = "No approved sons yet.";
    list.append(empty);
    return;
  }

  posts.forEach((post) => {
    const card = document.createElement("article");
    card.className = "admin-live-card";

    const img = document.createElement("img");
    img.src = post.image;
    img.alt = post.title;

    const info = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = post.title;
    const meta = document.createElement("p");
    meta.textContent = `by ${post.author} · ${post.votes} vote${post.votes === 1 ? "" : "s"}`;

    const actions = document.createElement("div");
    actions.className = "admin-actions";
    const del = document.createElement("button");
    del.className = "ghost-light-button";
    del.textContent = "Delete";
    del.addEventListener("click", () => {
      savePosts(loadJson(storageKey, []).filter((item) => item.id !== post.id));
      renderAdminLiveFeed();
      renderPosts();
      showToast("Son removed from live feed.");
    });
    actions.append(del);
    info.append(title, meta);
    card.append(img, info, actions);
    list.append(card);
  });
}

function renderAdminForum() {
  const userList = document.querySelector("#admin-user-list");
  const threadList = document.querySelector("#admin-thread-list");
  if (!userList) return;

  const posts = getPosts();
  const unlocked = getForumUnlocked();
  const banned = getBanned();
  const threads = loadJson(forumKey, []);
  const allAuthors = [...new Set(posts.map((p) => profileKey(p.author)).filter(Boolean))];

  userList.replaceChildren();
  if (!allAuthors.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No users yet.";
    userList.append(empty);
  } else {
    allAuthors.forEach((key) => {
      const displayAuthor = posts.find((p) => profileKey(p.author) === key)?.author || key;
      const row = document.createElement("div");
      row.className = "admin-forum-row";

      const name = document.createElement("span");
      name.textContent = displayAuthor;
      const isBanned = banned.includes(key);
      const isUnlocked = unlocked.includes(key);

      const badge = document.createElement("span");
      badge.className = `admin-badge ${isBanned ? "badge-banned" : isUnlocked ? "badge-unlocked" : "badge-normal"}`;
      badge.textContent = isBanned ? "banned" : isUnlocked ? "unlocked" : "normal";

      const actions = document.createElement("div");
      actions.className = "admin-forum-actions";

      if (!isBanned) {
        const forumBtn = document.createElement("button");
        forumBtn.className = isUnlocked ? "ghost-light-button" : "primary-button";
        forumBtn.textContent = isUnlocked ? "Revoke forum" : "Unlock forum";
        forumBtn.addEventListener("click", () => {
          const current = getForumUnlocked();
          saveForumUnlocked(isUnlocked ? current.filter((k) => k !== key) : [...current, key]);
          renderAdminForum();
          renderForums();
          showToast(isUnlocked ? "Forum access revoked." : "Forum access granted! 😭");
        });
        actions.append(forumBtn);
      }

      const banBtn = document.createElement("button");
      banBtn.className = isBanned ? "primary-button" : "ghost-light-button";
      banBtn.textContent = isBanned ? "Unban" : "Ban";
      banBtn.addEventListener("click", () => {
        const current = getBanned();
        saveBanned(isBanned ? current.filter((k) => k !== key) : [...current, key]);
        renderAdminForum();
        renderForums();
        showToast(isBanned ? "User unbanned." : "User banned.");
      });
      actions.append(banBtn);

      row.append(name, badge, actions);
      userList.append(row);
    });
  }

  if (!threadList) return;
  threadList.replaceChildren();
  if (!threads.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No forum threads yet.";
    threadList.append(empty);
    return;
  }
  threads.forEach((thread) => {
    const row = document.createElement("div");
    row.className = "admin-forum-row";
    const info = document.createElement("span");
    info.textContent = `${thread.title} — ${thread.author} · ${thread.votes} votes`;
    const del = document.createElement("button");
    del.className = "ghost-light-button";
    del.textContent = "Delete";
    del.addEventListener("click", () => {
      saveThreads(loadJson(forumKey, []).filter((t) => t.id !== thread.id));
      renderAdminForum();
      renderForums();
      showToast("Thread deleted.");
    });
    row.append(info, del);
    threadList.append(row);
  });
}

function renderAdminStats() {
  const panel = document.querySelector("#admin-stats-panel");
  if (!panel) return;
  const approved = loadJson(storageKey, []);
  const pending = getPendingPosts();
  const threads = loadJson(forumKey, []);
  const allPosts = getPosts();
  const totalVotes = allPosts.reduce((sum, p) => sum + p.votes, 0);
  const uniqueUsers = new Set(allPosts.map((p) => profileKey(p.author))).size;

  panel.innerHTML = `
    <div class="admin-stats-grid">
      <div class="stat-card"><span class="stat-num">${approved.length}</span><span class="stat-label">approved sons</span></div>
      <div class="stat-card"><span class="stat-num">${pending.length}</span><span class="stat-label">pending review</span></div>
      <div class="stat-card"><span class="stat-num">${totalVotes}</span><span class="stat-label">total votes</span></div>
      <div class="stat-card"><span class="stat-num">${uniqueUsers}</span><span class="stat-label">unique uploaders</span></div>
      <div class="stat-card"><span class="stat-num">${threads.length}</span><span class="stat-label">forum threads</span></div>
      <div class="stat-card"><span class="stat-num">${getForumUnlocked().length}</span><span class="stat-label">forum unlocked</span></div>
    </div>
  `;
}

function initAdminTabs() {
  const tabs = document.querySelectorAll(".admin-tab-btn");
  const panels = document.querySelectorAll(".admin-tab-panel");
  if (!tabs.length) return;

  function switchTab(targetId) {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.tab === targetId));
    panels.forEach((p) => p.hidden = p.id !== targetId);
    if (targetId === "tab-feed") renderAdminLiveFeed();
    if (targetId === "tab-forum") renderAdminForum();
    if (targetId === "tab-stats") renderAdminStats();
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  switchTab("tab-queue");
}

async function boot() {
  await refreshVerifiedAuthUser();
  updateAdminVisibility();
  protectAdminPage();
  renderPosts();
  renderSignup();
  renderForums();
  initAdminTabs();
}

const signinForm = document.querySelector("#signin-form");
if (signinForm) {
  signinForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const statusEl = document.querySelector("#signin-status");
    const email = document.querySelector("#signin-email")?.value?.trim() || "";
    const password = document.querySelector("#signin-password")?.value || "";

    if (!email) {
      if (statusEl) statusEl.textContent = "Please enter your email.";
      return;
    }

    if (statusEl) statusEl.textContent = "Signing in...";

    if (window.SonBackend?.isConfigured()) {
      const { data, error } = await window.SonBackend.signIn({ email, password });
      if (!error) {
        verifiedAuthEmail = data?.user?.email?.toLowerCase() || "";
        await refreshVerifiedAuthUser();
      }
    }

    const existing = getCurrentUser();
    const user = existing?.email?.toLowerCase() === email.toLowerCase()
      ? { ...existing }
      : { handle: normalizeHandle(email.split("@")[0]), email, display: "", passwordSet: true, createdAt: Date.now() };

    setCurrentUser({ ...user, email });
    updateAdminVisibility();

    if (statusEl) statusEl.textContent = isAdminUser()
      ? "Admin signed in. Redirecting..."
      : "Signed in! Redirecting...";
    window.setTimeout(() => {
      window.location.href = isAdminUser() ? routePath("admin/") : routePath("");
    }, 500);
  });
}

const authTabBtns = document.querySelectorAll(".auth-tab-btn");
authTabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.auth;
    authTabBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
    document.querySelectorAll(".auth-tab-panel").forEach((p) => {
      p.hidden = p.id !== target;
    });
  });
});

if (window.SonBackend?.ready) {
  window.SonBackend.ready.finally(boot);
} else {
  boot();
}
