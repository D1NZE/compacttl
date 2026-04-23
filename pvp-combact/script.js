const searchInput = document.querySelector("#playerSearch");
const filters = document.querySelectorAll("[data-filter]");
const rankingRows = document.querySelector("#rankingRows");
const emptyState = document.querySelector("#emptyState");
const playerDialog = document.querySelector("#playerDialog");
const infoDialog = document.querySelector("#infoDialog");
const infoNav = document.querySelector("#infoNav");
const infoClose = document.querySelector("#infoClose");
const dialogClose = document.querySelector(".dialog-close");
const dialogSkin = document.querySelector("#dialogSkin");
const dialogName = document.querySelector("#dialogName");
const dialogDiscordId = document.querySelector("#dialogDiscordId");
const dialogTier = document.querySelector("#dialogTier");
const dialogPoints = document.querySelector("#dialogPoints");
const dialogCombatRank = document.querySelector("#dialogCombatRank");
const dialogRegion = document.querySelector("#dialogRegion");
const dialogSource = document.querySelector("#dialogSource");
const modes = document.querySelectorAll(".mode");
const searchBox = document.querySelector(".search");
const searchPopover = document.querySelector("#searchPopover");
const pointsInfoButton = document.querySelector("#pointsInfoButton");
const pointsInfoPopover = document.querySelector("#pointsInfoPopover");
const heroEyebrow = document.querySelector(".hero .eyebrow");
const heroTitle = document.querySelector("#heroTitle");
const heroLede = document.querySelector("#heroLede");
const heroCenterLabel = document.querySelector("#heroCenterLabel");
const heroCenterImage = document.querySelector("#heroCenterImage");
const heroCenterEmoji = document.querySelector("#heroCenterEmoji");
const lastUpdated = document.querySelector("#lastUpdated");
const activeView = document.querySelector("#activeView");
const crystalMenu = document.querySelector("#crystalMenu");
const tierBuckets = document.querySelector("#tierBuckets");
const databasePanel = document.querySelector("#databasePanel");
const filtersPanel = document.querySelector("#filtersPanel");
const rankingsPanel = document.querySelector("#rankings");
const dbDiscordOnline = document.querySelector("#dbDiscordOnline");
const dbTestedPlayers = document.querySelector("#dbTestedPlayers");
const dbTopRegion = document.querySelector("#dbTopRegion");
const dbTopTier = document.querySelector("#dbTopTier");
const dbTotalPoints = document.querySelector("#dbTotalPoints");
const regionChart = document.querySelector("#regionChart");
const tierChart = document.querySelector("#tierChart");
const sourceChart = document.querySelector("#sourceChart");
const loaderScreen = document.querySelector("#loaderScreen");
const loaderCopy = document.querySelector("#loaderCopy");
const loaderPercent = document.querySelector("#loaderPercent");
const loaderBarFill = document.querySelector("#loaderBarFill");
const loaderStatusItems = document.querySelectorAll(".loader-status span");
const loaderDurationMs = 3400;

const tierOrder = ["HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5", "Unranked"];
const modeCopy = {
  Overall: {
    eyebrow: "Overall Rankings",
    title: "Overall Leaderboard",
    lede: "Search every tracked player by Minecraft name, Discord ID, tier, region, points, or combat rank.",
    center: "Overall",
    emoji: "🏆"
  },
  Crystal: {
    eyebrow: "Crystal PvP Rankings",
    title: "Crystal Leaderboard",
    lede: "Crystal placements grouped by HT and LT tiers, updated from staff test results and migrations.",
    center: "Crystal PvP",
    image: "img_3.png"
  },
  Database: {
    eyebrow: "Player Database",
    title: "Database Stats",
    lede: "Server and leaderboard stats showing tested players, regions, tier spread, sources, and total points.",
    center: "Database",
    emoji: "📈"
  }
};
const tierPoints = {
  LT5: 2,
  HT5: 4,
  LT4: 8,
  HT4: 14,
  LT3: 20,
  HT3: 30,
  LT2: 45,
  HT2: 65,
  LT1: 100,
  HT1: 150
};
const discordWidgetUrl = "https://discord.com/api/guilds/1463712180728762429/widget.json";
const fallbackPlayers = [
  {
    userId: "example",
    username: "D1NZE",
    ign: "D1NZE",
    tier: "LT3",
    region: "NA",
    source: "Example",
    updatedAt: null
  }
];

let activeRegion = "all";
let renderedPlayers = [];
let searchFocused = false;
let activeMode = "Crystal";

function animateNumber(element, target, suffix = "") {
  const value = Number(target);
  if (!element || !Number.isFinite(value)) {
    return;
  }

  const start = Number(element.dataset.value || 0);
  const duration = 520;
  const startedAt = performance.now();
  element.dataset.value = `${value}`;

  function frame(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = `${Math.round(start + (value - start) * eased)}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function getPlayers() {
  const data = window.TIERLIST_PLAYERS || {};
  const players = Array.isArray(data.players) ? data.players : [];
  return players.length ? players : fallbackPlayers;
}

function skinUrl(ign, size = 48) {
  return `https://mc-heads.net/avatar/${encodeURIComponent(ign || "Steve")}/${size}`;
}

function formatUpdated(value) {
  if (!value) {
    return "Example";
  }

  const diffMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return "Recently";
  }

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "Now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sortedPlayers() {
  return getPlayers().sort((a, b) => {
    const tierDiff = tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
    if (tierDiff !== 0) {
      return tierDiff;
    }
    return String(a.ign || a.username || "").localeCompare(String(b.ign || b.username || ""));
  });
}

function getTierPoints(tier) {
  return tierPoints[tier] || 0;
}

function getCombatRank(points, tier) {
  if (tier === "HT1" || points >= 150) {
    return "Combat Master";
  }
  if (points >= 65) {
    return "Combat Ace";
  }
  if (points >= 30) {
    return "Combat PvP";
  }
  if (points >= 14) {
    return "Combat Nocive";
  }
  if (points >= 4) {
    return "Standart";
  }
  if (points >= 2) {
    return "Rookie";
  }
  return "Unranked";
}

function displaySource(source) {
  const value = String(source || "").trim().toLowerCase();
  if (
    value.includes("migrat") ||
    value.includes("miragrat") ||
    value === "crystal ranked" ||
    value === "lurnss tierlist" ||
    value === "mctier list" ||
    value === "nova tierlist"
  ) {
    return "Miragrated";
  }

  return "Tested";
}

function renderRows() {
  renderedPlayers = sortedPlayers();
  const updatedAt = window.TIERLIST_PLAYERS?.updatedAt;
  lastUpdated.textContent = `Last updated: ${formatUpdated(updatedAt)}`;
  rankingRows.innerHTML = renderedPlayers
    .map((player, index) => {
      const ign = player.ign || player.username || "Unknown";
      const tier = player.tier || "Unranked";
      const region = player.region || "N/A";
      const points = getTierPoints(tier);
      const combatRank = getCombatRank(points, tier);
      const source = displaySource(player.source);
      const searchable = [
        ign,
        player.username,
        player.displayName,
        player.userId,
        tier,
        `${points} points`,
        combatRank,
        region,
        source
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return `
        <button class="ranking-row" type="button" data-index="${index}" data-region="${escapeHtml(region)}" data-name="${escapeHtml(ign)}" data-search="${escapeHtml(searchable)}">
          <span class="rank">${index + 1}</span>
          <span class="player-cell">
            <img class="skin-head" src="${skinUrl(ign)}" alt="${escapeHtml(ign)} Minecraft skin head">
            <strong>${escapeHtml(ign)}</strong>
          </span>
          <span class="tag ${escapeHtml(region.toLowerCase())}">${escapeHtml(region)}</span>
          <span class="tier ${escapeHtml(tier.toLowerCase())}">${escapeHtml(tier)}</span>
          <span class="points-pill">${points} pts</span>
          <span>${escapeHtml(source)}</span>
          <span>${escapeHtml(formatUpdated(player.updatedAt))}</span>
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".ranking-row").forEach((row) => {
    row.addEventListener("click", () => openPlayerDialog(renderedPlayers[Number(row.dataset.index)]));
  });
  renderTierBuckets();
  renderDatabase();
}

function hideLoader() {
  if (!loaderScreen) {
    return;
  }

  window.setTimeout(() => {
    loaderScreen.classList.add("is-hidden");
    document.body.classList.remove("is-loading");
  }, loaderDurationMs);
}

function runLoaderCopy() {
  if (!loaderCopy && !loaderPercent && !loaderBarFill && !loaderStatusItems.length) {
    return null;
  }

  const messages = [
    "Preparing the leaderboard",
    "Reading player tiers",
    "Matching Discord profiles",
    "Sorting Crystal rankings",
    "Building region filters",
    "Finalizing Vanilla-compact"
  ];
  let index = 0;
  const startedAt = performance.now();

  function update(now) {
    const progress = Math.min(1, (now - startedAt) / loaderDurationMs);
    const eased = 1 - Math.pow(1 - progress, 3);
    const percent = Math.min(100, Math.round(eased * 100));
    const nextIndex = Math.min(messages.length - 1, Math.floor(progress * messages.length));
    const activeStatus = Math.min(loaderStatusItems.length - 1, Math.floor(progress * loaderStatusItems.length));

    if (loaderCopy && nextIndex !== index) {
      index = nextIndex;
      loaderCopy.textContent = messages[index];
    }
    if (loaderPercent) {
      loaderPercent.textContent = `${percent}%`;
    }
    if (loaderBarFill) {
      loaderBarFill.style.width = `${Math.max(7, percent)}%`;
    }
    loaderStatusItems.forEach((item, itemIndex) => {
      item.classList.toggle("is-active", itemIndex === activeStatus);
    });
    if (loaderScreen) {
      loaderScreen.classList.toggle("is-ready", percent >= 94);
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
  return true;
}

function countBy(players, getter) {
  return players.reduce((counts, player) => {
    const key = getter(player) || "N/A";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function topLabel(counts) {
  const [label] =
    Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || [];
  return label || "N/A";
}

function renderBarChart(container, counts, order = []) {
  const entries = [
    ...order.filter((key) => Object.hasOwn(counts, key)).map((key) => [key, counts[key]]),
    ...Object.entries(counts).filter(([key]) => !order.includes(key))
  ];
  const max = Math.max(1, ...entries.map(([, value]) => value));

  container.innerHTML = entries.length
    ? entries
        .map(([label, value]) => `
          <div class="chart-row">
            <span>${escapeHtml(label)}</span>
            <div class="chart-track">
              <i style="width: ${(value / max) * 100}%"></i>
            </div>
            <strong>${value}</strong>
          </div>
        `)
        .join("")
    : `<p class="chart-empty">No data yet</p>`;
}

function renderDatabase() {
  const players = renderedPlayers;
  const regionCounts = countBy(players, (player) => player.region || "N/A");
  const tierCounts = countBy(players, (player) => player.tier || "Unranked");
  const sourceCounts = countBy(players, (player) => displaySource(player.source));
  const totalPoints = players.reduce(
    (sum, player) => sum + getTierPoints(player.tier || "Unranked"),
    0
  );

  dbTestedPlayers.textContent = `${players.length}`;
  animateNumber(dbTestedPlayers, players.length);
  dbTopRegion.textContent = topLabel(regionCounts);
  dbTopTier.textContent = topLabel(tierCounts);
  animateNumber(dbTotalPoints, totalPoints);
  renderBarChart(regionChart, regionCounts, ["NA", "EU", "AS", "N/A"]);
  renderBarChart(tierChart, tierCounts, tierOrder);
  renderBarChart(sourceChart, sourceCounts, ["Tested", "Miragrated"]);
}

function renderTierBuckets() {
  const tiers = [
    { title: "Tier #1", values: ["HT1", "LT1"], high: "HT1", low: "LT1" },
    { title: "Tier #2", values: ["HT2", "LT2"], high: "HT2", low: "LT2" },
    { title: "Tier #3", values: ["HT3", "LT3"], high: "HT3", low: "LT3" },
    { title: "Tier #4", values: ["HT4", "LT4"], high: "HT4", low: "LT4" },
    { title: "Tier #5", values: ["HT5", "LT5"], high: "HT5", low: "LT5" }
  ];
  tierBuckets.innerHTML = tiers
    .map((bucket, bucketIndex) => {
      const tierSections = bucket.values
        .map((tier) => {
          const players = renderedPlayers.filter((player) => player.tier === tier);
          const playerList = players.length
            ? players
                .map((player) => {
                  const ign = player.ign || player.username || "Unknown";
                  const region = player.region || "N/A";
                  const points = getTierPoints(player.tier || "Unranked");
                  return `
                    <button class="bucket-player" type="button" data-user-id="${escapeHtml(player.userId || "")}">
                      <img src="${skinUrl(ign, 32)}" alt="${escapeHtml(ign)} skin">
                      <strong>${escapeHtml(ign)}</strong>
                      <span class="mini-points">${points}</span>
                      <span class="mini-region ${escapeHtml(region.toLowerCase())}">${escapeHtml(region)}</span>
                    </button>
                  `;
                })
                .join("")
            : `<span class="bucket-empty">No ${escapeHtml(tier)} players</span>`;

          return `
            <section class="bucket-section">
              <h3>${escapeHtml(tier)}</h3>
              <div>${playerList}</div>
            </section>
          `;
        })
        .join("");

      return `
        <article class="tier-bucket bucket-${bucketIndex + 1}">
          <header>${bucket.title}</header>
          <div>${tierSections}</div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".bucket-player").forEach((button) => {
    button.addEventListener("click", () => {
      const player = renderedPlayers.find((item) => item.userId === button.dataset.userId);
      openPlayerDialog(player);
    });
  });
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const rows = [...document.querySelectorAll(".ranking-row")];
  let visibleRows = 0;
  searchBox.classList.toggle("has-value", query.length > 0);
  const matchingPlayers = [];

  rows.forEach((row) => {
    const matchesRegion =
      activeRegion === "all" || row.dataset.region === activeRegion;
    const matchesSearch = !query || (row.dataset.search || "").includes(query);

    const isVisible = matchesRegion && matchesSearch;
    row.hidden = !isVisible;
    if (isVisible) {
      visibleRows += 1;
      matchingPlayers.push(renderedPlayers[Number(row.dataset.index)]);
    }
  });

  emptyState.hidden = visibleRows > 0;
  renderSearchPopover(query, matchingPlayers);
}

function renderSearchPopover(query, matchingPlayers) {
  if (!query && !searchFocused) {
    searchPopover.hidden = true;
    searchPopover.innerHTML = "";
    return;
  }

  const player = matchingPlayers.find(Boolean) || renderedPlayers[0];
  if (!player) {
    searchPopover.hidden = false;
    searchPopover.innerHTML = `
      <div class="search-card muted">
        <strong>No player found</strong>
        <span>Try another username, tier, region, or Discord ID.</span>
      </div>
    `;
    return;
  }

  const ign = player.ign || player.username || "Unknown";
  const tier = player.tier || "Unranked";
  const region = player.region || "N/A";
  const points = getTierPoints(tier);
  const combatRank = getCombatRank(points, tier);
  const title = query ? "Best match" : "Start typing";
  searchPopover.hidden = false;
  searchPopover.innerHTML = `
    <button class="search-card" type="button">
      <img src="${skinUrl(ign, 64)}" alt="${escapeHtml(ign)} Minecraft skin head">
      <span>
        <em>${escapeHtml(title)}</em>
        <strong>${escapeHtml(ign)}</strong>
        <small>${escapeHtml(player.userId || "No Discord ID")}</small>
      </span>
      <span class="tier ${escapeHtml(tier.toLowerCase())}">${escapeHtml(tier)}</span>
      <span class="points-pill">${points} pts</span>
      <span class="tag ${escapeHtml(region.toLowerCase())}">${escapeHtml(region)}</span>
    </button>
  `;
  searchPopover.querySelector(".search-card").addEventListener("click", () => openPlayerDialog(player));
}

function loadDiscordCount() {
  fetch(discordWidgetUrl)
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      const onlineCount = Number(data?.presence_count);
      if (Number.isFinite(onlineCount) && onlineCount > 0) {
        animateNumber(dbDiscordOnline, onlineCount);
        return;
      }
      dbDiscordOnline.textContent = "N/A";
    })
    .catch(() => {
      dbDiscordOnline.textContent = "N/A";
    });
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }
  dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }
  dialog.removeAttribute("open");
}

function openPlayerDialog(player) {
  if (!player) {
    return;
  }

  const ign = player.ign || player.username || "Unknown";
  const tier = player.tier || "Unranked";
  const points = getTierPoints(tier);
  dialogSkin.src = skinUrl(ign, 96);
  dialogSkin.alt = `${ign} Minecraft skin head`;
  dialogName.textContent = ign;
  dialogDiscordId.textContent = player.userId || "N/A";
  dialogTier.textContent = tier;
  dialogPoints.textContent = `${points}`;
  dialogCombatRank.textContent = getCombatRank(points, tier);
  dialogRegion.textContent = player.region || "N/A";
  dialogSource.textContent = displaySource(player.source);
  openDialog(playerDialog);
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    if (!button.dataset.filter) {
      return;
    }
    activeRegion = button.dataset.filter;
    filters.forEach((item) => {
      if (item.dataset.filter) {
        item.classList.toggle("active", item === button);
      }
    });
    applyFilters();
  });
});

pointsInfoButton.addEventListener("click", () => {
  pointsInfoPopover.hidden = !pointsInfoPopover.hidden;
});

modes.forEach((button) => {
  button.addEventListener("click", () => {
    if (!button.dataset.mode) {
      openDialog(infoDialog);
      return;
    }
    modes.forEach((item) => item.classList.toggle("active", item === button));
    const mode = button.dataset.mode || "Crystal";
    activeMode = mode;
    const copy = modeCopy[mode] || modeCopy.Crystal;
    heroEyebrow.textContent = copy.eyebrow;
    heroTitle.textContent = copy.title;
    heroLede.textContent = copy.lede;
    heroCenterLabel.textContent = copy.center;
    if (copy.image) {
      heroCenterImage.src = copy.image;
      heroCenterImage.hidden = false;
      heroCenterEmoji.hidden = true;
    } else {
      heroCenterEmoji.textContent = copy.emoji || "";
      heroCenterEmoji.hidden = false;
      heroCenterImage.hidden = true;
    }
    activeView.textContent = `${mode} view`;
    document.body.dataset.view = mode.toLowerCase();
    crystalMenu.hidden = mode !== "Crystal";
    databasePanel.hidden = mode !== "Database";
    filtersPanel.hidden = mode !== "Overall";
    rankingsPanel.hidden = mode !== "Overall";
    searchPopover.hidden = true;
    pointsInfoPopover.hidden = true;
    if (mode === "Database") {
      databasePanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

dialogClose.addEventListener("click", () => closeDialog(playerDialog));

playerDialog.addEventListener("click", (event) => {
  if (event.target === playerDialog) {
    closeDialog(playerDialog);
  }
});

infoNav.addEventListener("click", (event) => {
  event.preventDefault();
  openDialog(infoDialog);
});

infoClose.addEventListener("click", () => closeDialog(infoDialog));

infoDialog.addEventListener("click", (event) => {
  if (event.target === infoDialog) {
    closeDialog(infoDialog);
  }
});

searchInput.addEventListener("input", applyFilters);
searchInput.addEventListener("keyup", applyFilters);
searchInput.addEventListener("search", applyFilters);
searchInput.addEventListener("focus", () => {
  searchFocused = true;
  applyFilters();
});
searchInput.addEventListener("blur", () => {
  window.setTimeout(() => {
    searchFocused = false;
    applyFilters();
  }, 140);
});

runLoaderCopy();
renderRows();
applyFilters();
loadDiscordCount();
document.body.dataset.view = activeMode.toLowerCase();
hideLoader();
