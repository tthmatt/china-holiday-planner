const STORAGE_KEY = "chinaHolidayPlannerStateV1";
const styleDailyBudget = {
  budget: 450,
  comfort: 850,
  premium: 1500,
};

const interestsList = [
  { id: "history", label: "History" },
  { id: "food", label: "Food" },
  { id: "nature", label: "Nature" },
  { id: "city", label: "City life" },
  { id: "slow", label: "Slow travel" },
  { id: "scenery", label: "Epic scenery" },
];

const checklistItems = [
  { key: "passport", label: "Passport valid for at least 6 months" },
  { key: "entry", label: "Check visa or entry requirements" },
  { key: "payments", label: "Set up Alipay or WeChat Pay" },
  { key: "rail", label: "Book high-speed rail or flight legs" },
  { key: "apps", label: "Install maps, translation and VPN tools if needed" },
  { key: "sights", label: "Reserve timed-entry attractions in advance" },
];

const destinations = [
  { id: "beijing", name: "Beijing", region: "North China", tags: ["history", "food", "city"], bestSeason: "Spring / Autumn", suggestedDays: 3, budgetLabel: "Moderate", costIndex: 2, blurb: "Imperial history, famous duck, hutongs and easy access to the Great Wall.", highlights: ["Forbidden City", "Mutianyu Great Wall", "Temple of Heaven"] },
  { id: "shanghai", name: "Shanghai", region: "East China", tags: ["city", "food", "slow"], bestSeason: "Spring / Autumn", suggestedDays: 3, budgetLabel: "Moderate", costIndex: 3, blurb: "A sleek megacity with art deco streets, skyline views and day trips nearby.", highlights: ["The Bund", "French Concession", "Zhujiajiao water town"] },
  { id: "xian", name: "Xi'an", region: "Northwest China", tags: ["history", "food", "city"], bestSeason: "Spring / Autumn", suggestedDays: 2, budgetLabel: "Value", costIndex: 1, blurb: "Ancient capital energy with the Terracotta Army and one of China's best food streets.", highlights: ["Terracotta Army", "City Wall", "Muslim Quarter"] },
  { id: "chengdu", name: "Chengdu", region: "Southwest China", tags: ["food", "slow", "city"], bestSeason: "Autumn", suggestedDays: 3, budgetLabel: "Value", costIndex: 1, blurb: "Relaxed pace, fiery food and panda visits make this one of the easiest wins.", highlights: ["Panda Base", "Sichuan hotpot", "People's Park"] },
  { id: "hangzhou", name: "Hangzhou", region: "East China", tags: ["slow", "nature", "city"], bestSeason: "Spring / Autumn", suggestedDays: 2, budgetLabel: "Moderate", costIndex: 2, blurb: "West Lake, tea villages and an elegant balance between nature and city comfort.", highlights: ["West Lake", "Longjing tea fields", "Lingyin Temple"] },
  { id: "guilin-yangshuo", name: "Guilin & Yangshuo", region: "South China", tags: ["nature", "scenery", "slow"], bestSeason: "Spring / Autumn", suggestedDays: 3, budgetLabel: "Moderate", costIndex: 2, blurb: "Classic karst landscapes, river cruising and easy biking routes.", highlights: ["Li River", "Yangshuo cycling", "Reed Flute Cave"] },
  { id: "zhangjiajie", name: "Zhangjiajie", region: "Central China", tags: ["nature", "scenery"], bestSeason: "Spring / Autumn", suggestedDays: 3, budgetLabel: "Moderate", costIndex: 2, blurb: "Towering sandstone pillars, glass bridges and dramatic mountain views.", highlights: ["National Forest Park", "Tianmen Mountain", "Glass Skywalk"] },
  { id: "yunnan-loop", name: "Yunnan Loop", region: "Southwest China", tags: ["nature", "food", "slow", "scenery"], bestSeason: "Spring", suggestedDays: 5, budgetLabel: "Moderate", costIndex: 2, blurb: "A scenic route through Kunming, Dali or Lijiang for altitude, cafés and old towns.", highlights: ["Dali old town", "Lijiang", "Erhai Lake"] },
  { id: "suzhou", name: "Suzhou", region: "East China", tags: ["slow", "history", "city"], bestSeason: "Spring / Autumn", suggestedDays: 2, budgetLabel: "Value", costIndex: 1, blurb: "Classical gardens, canals and a gentler pace within easy reach of Shanghai.", highlights: ["Humble Administrator's Garden", "Pingjiang Road", "Canals"] }
];

const defaultState = {
  tripName: "My China Adventure",
  startDate: "",
  endDate: "",
  budget: 12000,
  travelStyle: "comfort",
  interests: ["history", "food"],
  search: "",
  region: "all",
  tag: "all",
  shortlist: [],
  assignments: {},
  dayNotes: {},
  checklist: {},
};

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      ...defaultState,
      ...saved,
      assignments: saved.assignments || {},
      dayNotes: saved.dayNotes || {},
      checklist: saved.checklist || {},
      shortlist: Array.isArray(saved.shortlist) ? saved.shortlist : [],
      interests: Array.isArray(saved.interests) && saved.interests.length ? saved.interests : defaultState.interests,
    };
  } catch (error) {
    return { ...defaultState };
  }
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function byId(id) { return document.getElementById(id); }
function getDestinationById(id) { return destinations.find((destination) => destination.id === id); }

function getTripDayCount() {
  if (state.startDate && state.endDate) {
    const start = new Date(state.startDate);
    const end = new Date(state.endDate);
    const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (!Number.isNaN(diff) && diff > 0 && diff < 60) return diff;
  }
  return 7;
}

function getTripDays() { return Array.from({ length: getTripDayCount() }, (_, index) => index + 1); }
function formatDays(count) { return `${count} day${count === 1 ? "" : "s"}`; }
function formatCurrency(value) { return `CNY ${Math.round(value).toLocaleString()}`; }

function clampAssignments() {
  const maxDay = getTripDayCount();
  Object.keys(state.assignments).forEach((destinationId) => {
    if (!state.shortlist.includes(destinationId)) delete state.assignments[destinationId];
    if (Number(state.assignments[destinationId]) > maxDay) state.assignments[destinationId] = 0;
  });
}

function estimateBudget() {
  const dailyRate = styleDailyBudget[state.travelStyle] || styleDailyBudget.comfort;
  const routeComplexity = Math.max(0, state.shortlist.length - 1) * 220;
  const destinationLoad = state.shortlist.reduce((total, destinationId) => {
    const destination = getDestinationById(destinationId);
    return total + (destination ? destination.costIndex * 180 : 0);
  }, 0);
  return getTripDayCount() * dailyRate + routeComplexity + destinationLoad;
}

function scoreDestination(destination) {
  const chosen = new Set(state.interests || []);
  const interestHits = destination.tags.filter((tag) => chosen.has(tag)).length;
  const shortlistBoost = state.shortlist.includes(destination.id) ? 5 : 0;
  return interestHits * 3 + shortlistBoost + destination.suggestedDays * 0.1;
}

function getFilteredDestinations() {
  const searchTerm = state.search.trim().toLowerCase();
  return [...destinations]
    .filter((destination) => {
      const matchesSearch = !searchTerm || destination.name.toLowerCase().includes(searchTerm) || destination.region.toLowerCase().includes(searchTerm) || destination.tags.join(" ").toLowerCase().includes(searchTerm) || destination.highlights.join(" ").toLowerCase().includes(searchTerm) || destination.blurb.toLowerCase().includes(searchTerm);
      const matchesRegion = state.region === "all" || destination.region === state.region;
      const matchesTag = state.tag === "all" || destination.tags.includes(state.tag);
      return matchesSearch && matchesRegion && matchesTag;
    })
    .sort((left, right) => scoreDestination(right) - scoreDestination(left) || left.name.localeCompare(right.name));
}

function buildInterestPicks() {
  const wrapper = byId("interest-picks");
  wrapper.innerHTML = interestsList.map((interest) => {
    const checked = state.interests.includes(interest.id) ? "checked" : "";
    return `<label class="chip"><input type="checkbox" value="${interest.id}" ${checked} /><span>${interest.label}</span></label>`;
  }).join("");

  wrapper.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const value = event.target.value;
      if (event.target.checked) state.interests = [...new Set([...state.interests, value])];
      else state.interests = state.interests.filter((item) => item !== value);
      saveState();
      renderAll();
    });
  });
}

function buildFilterOptions() {
  const regions = ["all", ...new Set(destinations.map((destination) => destination.region))];
  const tags = ["all", ...new Set(destinations.flatMap((destination) => destination.tags))].sort();
  byId("region-filter").innerHTML = regions.map((region) => `<option value="${region}">${region === "all" ? "All regions" : region}</option>`).join("");
  byId("tag-filter").innerHTML = tags.map((tag) => `<option value="${tag}">${tag === "all" ? "All themes" : tag}</option>`).join("");
  byId("region-filter").value = state.region;
  byId("tag-filter").value = state.tag;
}

function hydrateForm() {
  byId("trip-name").value = state.tripName;
  byId("start-date").value = state.startDate;
  byId("end-date").value = state.endDate;
  byId("budget").value = state.budget;
  byId("travel-style").value = state.travelStyle;
  byId("search-input").value = state.search;
}

function renderSummary() {
  const dayCount = getTripDayCount();
  const estimate = estimateBudget();
  const targetBudget = Number(state.budget) || 0;
  const delta = targetBudget - estimate;
  let helperText = `Estimated spend is ${formatCurrency(estimate)} for ${formatDays(dayCount)} at a ${state.travelStyle} pace.`;
  if (targetBudget > 0) helperText += delta >= 0 ? ` You still have about ${formatCurrency(delta)} of buffer.` : ` You are about ${formatCurrency(Math.abs(delta))} over your target budget.`;
  byId("summary-trip-name").textContent = state.tripName || defaultState.tripName;
  byId("summary-days").textContent = formatDays(dayCount);
  byId("summary-shortlist").textContent = `${state.shortlist.length} place${state.shortlist.length === 1 ? "" : "s"}`;
  byId("summary-budget").textContent = formatCurrency(estimate);
  byId("budget-helper").textContent = helperText;
}

function assignmentOptions(selectedValue = 0) {
  return [`<option value="0" ${Number(selectedValue) === 0 ? "selected" : ""}>Ideas list</option>`].concat(getTripDays().map((day) => `<option value="${day}" ${Number(selectedValue) === day ? "selected" : ""}>Day ${day}</option>`)).join("");
}

function toggleShortlist(destinationId) {
  if (state.shortlist.includes(destinationId)) {
    state.shortlist = state.shortlist.filter((id) => id !== destinationId);
    delete state.assignments[destinationId];
  } else {
    state.shortlist = [...state.shortlist, destinationId];
    state.assignments[destinationId] = state.assignments[destinationId] || 0;
  }
  saveState();
  renderAll();
}

function assignDestination(destinationId, value) {
  if (!state.shortlist.includes(destinationId)) return;
  state.assignments[destinationId] = Number(value);
  saveState();
  renderAll();
}

function renderDestinations() {
  const wrapper = byId("destination-list");
  const matches = getFilteredDestinations();
  if (!matches.length) {
    wrapper.innerHTML = `<div class="mini-card"><p>No destinations match your current filters. Try broadening the search.</p></div>`;
    return;
  }

  wrapper.innerHTML = matches.map((destination) => {
    const isSaved = state.shortlist.includes(destination.id);
    const selectedDay = state.assignments[destination.id] || 0;
    return `<article class="destination-card">
      <div class="destination-card__meta">
        <span class="pill">${destination.region}</span>
        <span class="pill pill--neutral">${destination.bestSeason}</span>
        <span class="pill pill--neutral">${destination.budgetLabel}</span>
      </div>
      <h3>${destination.name}</h3>
      <p>${destination.blurb}</p>
      <div class="destination-card__highlights">${destination.tags.map((tag) => `<span class="pill pill--neutral">${tag}</span>`).join("")}</div>
      <p><strong>Highlights:</strong> ${destination.highlights.join(" • ")}</p>
      <div class="destination-card__actions">
        <button class="button ${isSaved ? "button--secondary" : "button--primary"} button--small" data-shortlist="${destination.id}">${isSaved ? "Remove from trip" : "Add to trip"}</button>
        ${isSaved ? `<select class="assign-select" data-assign="${destination.id}">${assignmentOptions(selectedDay)}</select>` : `<span class="muted">Suggested stay: ${formatDays(destination.suggestedDays)}</span>`}
      </div>
    </article>`;
  }).join("");

  wrapper.querySelectorAll("[data-shortlist]").forEach((button) => {
    button.addEventListener("click", () => toggleShortlist(button.dataset.shortlist));
  });
  wrapper.querySelectorAll("[data-assign]").forEach((select) => {
    select.addEventListener("change", (event) => assignDestination(select.dataset.assign, event.target.value));
  });
}

function renderShortlist() {
  const wrapper = byId("shortlist-panel");
  if (!state.shortlist.length) {
    wrapper.innerHTML = "";
    return;
  }

  wrapper.innerHTML = state.shortlist.map((destinationId) => {
    const destination = getDestinationById(destinationId);
    const selectedDay = state.assignments[destinationId] || 0;
    if (!destination) return "";
    return `<div class="saved-item">
      <div class="saved-item__info"><strong>${destination.name}</strong><span class="muted">${destination.region} • ${destination.highlights[0]}</span></div>
      <div class="destination-card__actions">
        <select class="assign-select" data-shortlist-assign="${destination.id}">${assignmentOptions(selectedDay)}</select>
        <button class="button button--ghost button--small" data-remove-saved="${destination.id}">Remove</button>
      </div>
    </div>`;
  }).join("");

  wrapper.querySelectorAll("[data-shortlist-assign]").forEach((select) => {
    select.addEventListener("change", (event) => assignDestination(select.dataset.shortlistAssign, event.target.value));
  });
  wrapper.querySelectorAll("[data-remove-saved]").forEach((button) => {
    button.addEventListener("click", () => toggleShortlist(button.dataset.removeSaved));
  });
}

function renderChecklist() {
  const wrapper = byId("checklist");
  wrapper.innerHTML = checklistItems.map((item) => {
    const checked = state.checklist[item.key] ? "checked" : "";
    return `<label class="check-item"><input type="checkbox" data-checklist="${item.key}" ${checked} /><span>${item.label}</span></label>`;
  }).join("");
  wrapper.querySelectorAll("[data-checklist]").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      state.checklist[checkbox.dataset.checklist] = event.target.checked;
      saveState();
    });
  });
}

function renderItinerary() {
  const wrapper = byId("itinerary-board");
  const assigned = getTripDays().reduce((map, day) => ({ ...map, [day]: [] }), {});
  state.shortlist.forEach((destinationId) => {
    const day = Number(state.assignments[destinationId] || 0);
    if (day > 0 && assigned[day]) assigned[day].push(getDestinationById(destinationId));
  });

  wrapper.innerHTML = getTripDays().map((day) => {
    const items = (assigned[day] || []).filter(Boolean);
    const notes = state.dayNotes[day] || "";
    return `<article class="day-card">
      <div class="day-card__header"><div><span class="pill">Day ${day}</span><h3>${items.length ? "Planned stops" : "Open day"}</h3></div><span class="muted">${items.length} stop${items.length === 1 ? "" : "s"}</span></div>
      <div class="day-list">${items.length ? items.map((destination) => `<div class="day-list-item"><div class="day-list-item__info"><strong>${destination.name}</strong><span class="muted">${destination.highlights[0]}</span></div><select class="assign-select" data-itinerary-move="${destination.id}">${assignmentOptions(day)}</select></div>`).join("") : `<div class="day-card__empty">Keep this flexible for travel, food crawls or rest.</div>`}</div>
      <label><span>Notes</span><textarea data-day-note="${day}" placeholder="Hotel ideas, train numbers, restaurant targets, booking reminders...">${notes}</textarea></label>
    </article>`;
  }).join("");

  wrapper.querySelectorAll("[data-itinerary-move]").forEach((select) => {
    select.addEventListener("change", (event) => assignDestination(select.dataset.itineraryMove, event.target.value));
  });
  wrapper.querySelectorAll("[data-day-note]").forEach((textarea) => {
    textarea.addEventListener("input", (event) => {
      state.dayNotes[textarea.dataset.dayNote] = event.target.value;
      saveState();
    });
  });
}

function generateStarterRoute() {
  const days = getTripDayCount();
  const picks = [];
  const rules = {
    history: ["beijing", "xian", "suzhou"],
    food: ["chengdu", "beijing", "shanghai"],
    nature: ["guilin-yangshuo", "zhangjiajie", "yunnan-loop"],
    city: ["shanghai", "beijing", "hangzhou"],
    slow: ["hangzhou", "suzhou", "chengdu"],
    scenery: ["zhangjiajie", "guilin-yangshuo", "yunnan-loop"],
  };

  state.interests.forEach((interest) => {
    (rules[interest] || []).forEach((id) => { if (!picks.includes(id)) picks.push(id); });
  });
  ["beijing", "shanghai", "xian", "chengdu", "hangzhou", "guilin-yangshuo"].forEach((id) => { if (!picks.includes(id)) picks.push(id); });

  const stopCount = days <= 4 ? 2 : days <= 7 ? 3 : days <= 10 ? 4 : 5;
  const selected = picks.slice(0, stopCount);
  state.shortlist = [...new Set([...state.shortlist, ...selected])];

  let cursor = 1;
  selected.forEach((destinationId) => {
    if (!state.assignments[destinationId] || Number(state.assignments[destinationId]) === 0) {
      state.assignments[destinationId] = cursor;
      const destination = getDestinationById(destinationId);
      const step = Math.max(1, Math.min(3, (destination?.suggestedDays || 2) - 1 || 1));
      cursor = Math.min(days, cursor + step);
    }
  });

  saveState();
  renderAll();
}

function exportPlan() {
  const lines = [];
  lines.push(`# ${state.tripName || defaultState.tripName}`);
  lines.push("");
  lines.push(`- Length: ${formatDays(getTripDayCount())}`);
  lines.push(`- Travel style: ${state.travelStyle}`);
  lines.push(`- Target budget: ${formatCurrency(Number(state.budget) || 0)}`);
  lines.push(`- Estimated spend: ${formatCurrency(estimateBudget())}`);
  if (state.startDate && state.endDate) lines.push(`- Dates: ${state.startDate} to ${state.endDate}`);
  lines.push("");
  lines.push("## Interests");
  lines.push(state.interests.length ? state.interests.map((item) => `- ${item}`).join("\n") : "- None selected");
  lines.push("");
  lines.push("## Shortlist");
  lines.push(state.shortlist.length ? state.shortlist.map((id) => {
    const destination = getDestinationById(id);
    return destination ? `- ${destination.name} (${destination.region})` : null;
  }).filter(Boolean).join("\n") : "- No saved places yet");
  lines.push("");
  lines.push("## Itinerary");
  getTripDays().forEach((day) => {
    lines.push(`### Day ${day}`);
    const items = state.shortlist.filter((id) => Number(state.assignments[id]) === day).map((id) => getDestinationById(id)).filter(Boolean);
    if (!items.length) lines.push("- Open day");
    else items.forEach((destination) => lines.push(`- ${destination.name}: ${destination.highlights.join(", ")}`));
    if (state.dayNotes[day]) lines.push(`- Notes: ${state.dayNotes[day]}`);
    lines.push("");
  });
  lines.push("## Checklist");
  checklistItems.forEach((item) => lines.push(`- [${state.checklist[item.key] ? "x" : " "}] ${item.label}`));

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(state.tripName || "china-trip-plan").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderAll() {
  clampAssignments();
  renderSummary();
  renderDestinations();
  renderShortlist();
  renderChecklist();
  renderItinerary();
}

function handleTripFormChange(event) {
  const { id, value } = event.target;
  if (id === "trip-name") state.tripName = value || defaultState.tripName;
  if (id === "start-date") state.startDate = value;
  if (id === "end-date") state.endDate = value;
  if (id === "budget") state.budget = value;
  if (id === "travel-style") state.travelStyle = value;
  saveState();
  renderAll();
}

function init() {
  hydrateForm();
  buildInterestPicks();
  buildFilterOptions();
  renderAll();
  byId("trip-form").addEventListener("input", handleTripFormChange);
  byId("trip-form").addEventListener("change", handleTripFormChange);
  byId("search-input").addEventListener("input", (event) => { state.search = event.target.value; saveState(); renderDestinations(); });
  byId("region-filter").addEventListener("change", (event) => { state.region = event.target.value; saveState(); renderDestinations(); });
  byId("tag-filter").addEventListener("change", (event) => { state.tag = event.target.value; saveState(); renderDestinations(); });
  byId("generate-route").addEventListener("click", generateStarterRoute);
  byId("export-plan").addEventListener("click", exportPlan);
}

document.addEventListener("DOMContentLoaded", init);
