const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const settingsForm = document.querySelector("#settingsForm");
const generateButton = document.querySelector("#generateButton");
const clearButton = document.querySelector("#clearButton");
const emptyState = document.querySelector("#emptyState");
const templateGrid = document.querySelector("#templateGrid");
const templateInput = document.querySelector("#templateInput");
const templateCountLabel = document.querySelector("#templateCountLabel");
const equalGridControl = document.querySelector("#equalGridControl");
const equalGridRatioValue = document.querySelector("#equalGridRatioValue");
const previewStage = document.querySelector("#previewStage");
const previewZoomOut = document.querySelector("#previewZoomOut");
const previewZoomFit = document.querySelector("#previewZoomFit");
const previewZoomIn = document.querySelector("#previewZoomIn");
const previewZoomLabel = document.querySelector("#previewZoomLabel");
const editableCollage = document.querySelector("#editableCollage");
const updateCard = document.querySelector("#updateCard");
const updateTitle = document.querySelector("#updateTitle");
const updateText = document.querySelector("#updateText");
const installUpdateButton = document.querySelector("#installUpdateButton");
const releaseLink = document.querySelector("#releaseLink");

const canvasPresets = {
  Auto: [1080, 1920],
  Square: [1080, 1080],
  Portrait: [1080, 1920],
  Landscape: [1920, 1080]
};

let templates = {};
let templateDirectory = '';

let selectedFiles = [];
let currentLayout = [];
let previewZoom = 1;
let fitPreviewZoom = 1;
let isPreviewZoomManual = true;
let hasRenderedPreview = false;
let dragState = null;
let previewPanState = null;
let renderTimer = null;
let floatingMessageTimer = null;
let configSaveTimer = null;
let appConfig = null;
let lastPointerPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const longPressMs = 450;
const minPreviewZoom = 0.12;
const maxPreviewZoom = 2.5;

initializeApp();

fileInput.addEventListener("change", () => {
  addFiles([...fileInput.files]);
  fileInput.value = "";
});

dropZone.addEventListener("dragover", event => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone.addEventListener("drop", event => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  const files = [...event.dataTransfer.files].filter(file => file.type.startsWith("image/"));
  addFiles(files);
});

clearButton.addEventListener("click", () => {
  clearFiles();
  fileInput.value = "";
});

settingsForm.addEventListener("submit", async event => {
  event.preventDefault();
  await generateCollage();
});

settingsForm.addEventListener("input", event => {
  if (["width", "height", "gap", "padding", "radius", "background", "equalGridRatio"].includes(event.target.name)) {
    updateEqualGridControl();
    scheduleConfigSave();
    schedulePreviewRender();
  }
});

settingsForm.addEventListener("change", event => {
  if (["mode", "template"].includes(event.target.name)) {
    if (event.target.name === "mode") {
      applyCanvasMode(event.target.value);
    }

    resetPlacements();
    scheduleConfigSave();
    schedulePreviewRender();
  }
});

window.addEventListener("resize", schedulePreviewRender);
window.addEventListener("pointermove", updatePointerPosition, { passive: true });

previewStage.addEventListener("wheel", zoomPreview);
previewStage.addEventListener("pointerdown", beginPreviewPan);
previewZoomOut.addEventListener("click", () => stepPreviewZoom(-1));
previewZoomIn.addEventListener("click", () => stepPreviewZoom(1));
previewZoomFit.addEventListener("click", fitPreviewToStage);
installUpdateButton.addEventListener("click", installUpdate);

async function initializeApp() {
  await loadConfig();
  await loadTemplates();
  renderTemplates();
  checkForUpdates();
}

async function loadTemplates() {
  try {
    const response = await fetch("/api/templates");
    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    templateDirectory = payload.templateDirectory || "";
    templates = groupTemplates(payload.templates || []);
  } catch (error) {
    console.warn("模板加载失败，已保留自动网格。", error);
  }
}

function groupTemplates(items) {
  return items.reduce((groups, item) => {
    const normalized = normalizeTemplate(item);
    if (!normalized) {
      return groups;
    }

    const key = normalized.imageCount;
    groups[key] = groups[key] || [];
    groups[key].push(normalized);
    return groups;
  }, {});
}

function normalizeTemplate(item) {
  const cells = Array.isArray(item.cells)
    ? item.cells.map(cell => [
      Number(cell.column),
      Number(cell.row),
      Number(cell.columnSpan),
      Number(cell.rowSpan)
    ])
    : [];

  const imageCount = Number(item.imageCount);
  const columns = Number(item.columns || 6);
  const rows = Number(item.rows || 6);
  if (!item.id || !Number.isInteger(imageCount) || imageCount <= 0 || cells.length !== imageCount) {
    return null;
  }

  return {
    id: item.id,
    name: item.name || item.id,
    source: item.source || "custom",
    imageCount,
    columns: Number.isFinite(columns) ? columns : 6,
    rows: Number.isFinite(rows) ? rows : 6,
    iconUrl: item.iconUrl || "",
    cells
  };
}

async function loadConfig() {
  try {
    const response = await fetch("/api/config");
    if (!response.ok) {
      return;
    }

    appConfig = await response.json();
    applySavedSettings(appConfig.settings);
  } catch {
  }
}

function applySavedSettings(settings) {
  if (!settings) {
    return;
  }

  settingsForm.elements.width.value = String(settings.width ?? 1080);
  settingsForm.elements.height.value = String(settings.height ?? 1920);
  settingsForm.elements.gap.value = String(settings.gap ?? 18);
  settingsForm.elements.padding.value = String(settings.padding ?? 28);
  settingsForm.elements.radius.value = String(settings.radius ?? 18);
  settingsForm.elements.background.value = settings.background || "#ffffff";
  settingsForm.elements.equalGridRatio.value = String(settings.equalGridRatio ?? 1);
  templateInput.value = settings.template || "auto";

  const mode = settings.mode || "Portrait";
  const modeInput = settingsForm.querySelector(`input[name="mode"][value="${mode}"]`);
  if (modeInput) {
    modeInput.checked = true;
  }

  updateEqualGridControl();
  resetPreviewZoom();
}

function scheduleConfigSave() {
  clearTimeout(configSaveTimer);
  configSaveTimer = window.setTimeout(saveConfig, 350);
}

async function saveConfig() {
  const nextConfig = {
    port: appConfig?.port || 5123,
    settings: readSettingsConfig()
  };

  try {
    const response = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextConfig)
    });

    if (response.ok) {
      appConfig = await response.json();
    }
  } catch {
  }
}

function readSettingsConfig() {
  const formData = new FormData(settingsForm);
  return {
    width: readNumber(formData, "width", 1080),
    height: readNumber(formData, "height", 1920),
    gap: readNumber(formData, "gap", 18),
    padding: readNumber(formData, "padding", 28),
    radius: readNumber(formData, "radius", 18),
    background: formData.get("background") || "#ffffff",
    mode: formData.get("mode") || "Portrait",
    template: templateInput.value || "auto",
    equalGridRatio: readNumber(formData, "equalGridRatio", 1)
  };
}

async function checkForUpdates() {
  try {
    const response = await fetch("/api/update/status");
    if (!response.ok) {
      return;
    }

    const info = await response.json();
    renderUpdateInfo(info);
  } catch {
  }
}

function renderUpdateInfo(info) {
  if (info.releaseUrl) {
    releaseLink.href = info.releaseUrl;
  }

  if (!info.supported || !info.updateAvailable) {
    updateCard.hidden = true;
    return;
  }

  updateTitle.textContent = info.latestVersion
    ? `发现新版本 ${info.latestVersion}`
    : "发现新版本";
  updateText.textContent = "是否更新由你决定，点击后才会下载并重启安装。";
  installUpdateButton.disabled = Boolean(info.installing);
  installUpdateButton.textContent = info.installing ? "更新中..." : "立即更新";
  updateCard.hidden = false;
}

async function installUpdate() {
  installUpdateButton.disabled = true;
  installUpdateButton.textContent = "更新中...";
  updateText.textContent = "正在下载更新，完成后会自动重启安装。";

  try {
    const response = await fetch("/api/update/install", { method: "POST" });
    if (!response.ok) {
      throw new Error("更新请求失败。");
    }

    const info = await response.json();
    renderUpdateInfo(info);
    if (!info.installing) {
      updateText.textContent = info.message || "没有可安装的更新。";
      installUpdateButton.disabled = false;
    }
  } catch (error) {
    updateText.textContent = error.message || "更新失败，请从 Release 页面手动下载。";
    installUpdateButton.disabled = false;
    installUpdateButton.textContent = "重试更新";
  }
}

function addFiles(files) {
  const existingKeys = new Set(selectedFiles.map(item => createFileKey(item.file)));
  const additions = [];
  let skippedDuplicates = 0;

  for (const file of files) {
    const key = createFileKey(file);
    if (existingKeys.has(key)) {
      skippedDuplicates += 1;
      continue;
    }

    existingKeys.add(key);
    additions.push(createFileItem(file));
  }

  if (additions.length === 0) {
    updateSelectionStatus(skippedDuplicates);
    return;
  }

  selectedFiles = [...selectedFiles, ...additions];
  updateSelectionState(skippedDuplicates);
}

function createFileItem(file) {
  const item = {
    file,
    previewUrl: URL.createObjectURL(file),
    aspect: 1,
    offsetX: 0,
    offsetY: 0,
    scale: 1
  };

  const image = new Image();
  image.onload = () => {
    item.aspect = clampAspect(image.naturalWidth / Math.max(1, image.naturalHeight));
    schedulePreviewRender();
  };
  image.src = item.previewUrl;

  return item;
}

function createFileKey(file) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function clearFiles() {
  selectedFiles.forEach(item => URL.revokeObjectURL(item.previewUrl));
  selectedFiles = [];
  resetPreviewZoom();
  hasRenderedPreview = false;
  updateSelectionState();
}

function removeFile(index) {
  const item = selectedFiles[index];
  if (!item) {
    return;
  }

  URL.revokeObjectURL(item.previewUrl);
  selectedFiles.splice(index, 1);
  updateSelectionState();
}

function updateSelectionState(skippedDuplicates = 0) {
  const shouldFitInitialPreview = !hasRenderedPreview && selectedFiles.length > 0;
  renderTemplates();
  updateSelectionStatus(skippedDuplicates);

  if (selectedFiles.length === 0) {
    resetPreview();
    return;
  }

  if (shouldFitInitialPreview) {
    fitPreviewToStage();
  } else {
    schedulePreviewRender();
  }
}

function updateSelectionStatus(skippedDuplicates = 0) {
  if (skippedDuplicates > 0) {
    showFloatingMessage(`跳过 ${skippedDuplicates} 张重复图片`);
  }
}

function renderTemplates() {
  templateGrid.replaceChildren();
  const templateItems = getTemplatesForCurrentCount();

  if (selectedFiles.length === 0) {
    templateInput.value = "auto";
    templateCountLabel.textContent = "自动";
    updateEqualGridControl();
    updatePreviewZoomControls();
    const message = document.createElement("p");
    message.className = "template-empty";
    message.textContent = "选择图片后显示对应模板。";
    templateGrid.appendChild(message);
    return;
  }

  const items = [createAutoTemplateOption(), createEqualGridTemplateOption(), ...templateItems];
  const fragment = document.createDocumentFragment();
  const activeStillVisible = items.some(item => item.id === templateInput.value);
  templateInput.value = activeStillVisible ? templateInput.value : "auto";
  templateCountLabel.textContent = `${selectedFiles.length} 张`;

  items.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = item.id === templateInput.value ? "template-card is-active" : "template-card";
    button.title = item.name;
    button.setAttribute("aria-label", item.name);
    button.appendChild(createTemplateOptionPreview(item));

    button.addEventListener("click", () => {
      templateInput.value = item.id;
      resetPlacements();
      renderTemplates();
      scheduleConfigSave();
      schedulePreviewRender();
    });

    fragment.appendChild(button);
  });

  templateGrid.appendChild(fragment);
  updateEqualGridControl();
}

function createTemplateOptionPreview(item) {
  if (item.id === "auto") {
    return createAutoTemplatePreview();
  }

  if (item.id === "equal-grid") {
    return createEqualGridTemplatePreview();
  }

  return createTemplatePreview(item);
}

function createTemplatePreview(item) {
  if (item.iconUrl) {
    const image = document.createElement("img");
    image.className = "template-icon";
    image.src = item.iconUrl;
    image.alt = "";
    return image;
  }

  const preview = document.createElement("span");
  preview.className = "template-preview";

  item.cells.forEach(cell => {
    const block = document.createElement("span");
    block.style.gridColumn = `${cell[0] + 1} / span ${cell[2]}`;
    block.style.gridRow = `${cell[1] + 1} / span ${cell[3]}`;
    preview.appendChild(block);
  });

  return preview;
}

async function generateCollage() {
  if (selectedFiles.length === 0) {
    showFloatingMessage("请先选择图片");
    return;
  }

  renderTemplates();
  renderEditablePreview();
  await exportAndDownload();
}

function renderEditablePreview(options = {}) {
  const preserveViewport = options.preserveViewport !== false;
  const previousViewport = preserveViewport ? capturePreviewViewport() : null;
  const settings = getSettings();
  const layout = createLayout(selectedFiles.length, settings);

  emptyState.classList.toggle("is-hidden", selectedFiles.length > 0);
  editableCollage.classList.toggle("has-collage", selectedFiles.length > 0);
  editableCollage.replaceChildren();

  if (selectedFiles.length === 0) {
    hasRenderedPreview = false;
    return;
  }

  const scale = getPreviewScale(settings);
  editableCollage.style.width = `${settings.width * scale}px`;
  editableCollage.style.height = `${settings.height * scale}px`;
  editableCollage.style.background = settings.background;
  currentLayout = layout.map(rect => ({
    x: rect.x * scale,
    y: rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale
  }));

  selectedFiles.forEach((item, index) => {
    const rect = layout[index];
    const displayRect = currentLayout[index];
    const tile = document.createElement("div");
    tile.className = "collage-tile";
    tile.dataset.index = index;
    tile.style.left = `${displayRect.x}px`;
    tile.style.top = `${displayRect.y}px`;
    tile.style.width = `${displayRect.width}px`;
    tile.style.height = `${displayRect.height}px`;
    tile.style.borderRadius = `${settings.radius * scale}px`;
    tile.style.boxShadow = `0 ${Math.max(2, settings.gap * scale / 4)}px ${Math.max(8, settings.gap * scale)}px rgba(0, 0, 0, .18)`;

    const image = document.createElement("img");
    image.src = item.previewUrl;
    image.alt = item.file.name;
    image.draggable = false;
    image.addEventListener("load", () => applyImagePlacement(image, item, displayRect));
    applyImagePlacement(image, item, displayRect);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "tile-remove";
    removeButton.textContent = "×";
    removeButton.title = "删除图片";
    removeButton.setAttribute("aria-label", `删除 ${item.file.name}`);
    removeButton.addEventListener("pointerdown", event => {
      event.stopPropagation();
    });
    removeButton.addEventListener("click", event => {
      event.stopPropagation();
      removeFile(index);
      showFloatingMessage("已删除图片", event);
    });

    tile.appendChild(image);
    tile.appendChild(removeButton);
    tile.addEventListener("pointerdown", event => beginTileDrag(event, index));
    tile.addEventListener("wheel", event => zoomTileImage(event, index));
    editableCollage.appendChild(tile);
  });

  hasRenderedPreview = true;
  if (previousViewport) {
    restorePreviewViewport(previousViewport);
  }
}

function getPreviewScale(settings) {
  const maxWidth = Math.max(180, previewStage.clientWidth - 32);
  const maxHeight = Math.max(180, previewStage.clientHeight - 32);
  fitPreviewZoom = clamp(Math.min(maxWidth / settings.width, maxHeight / settings.height), minPreviewZoom, 1);

  if (!hasRenderedPreview && !isPreviewZoomManual) {
    previewZoom = fitPreviewZoom;
  }

  previewZoom = clamp(previewZoom, minPreviewZoom, maxPreviewZoom);
  updatePreviewZoomControls();
  return previewZoom;
}

function zoomPreview(event) {
  if (event.target.closest(".collage-tile") && canWheelZoomTile(event)) {
    return;
  }

  event.preventDefault();
  setPreviewZoom(previewZoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12), event.clientX, event.clientY);
}

function stepPreviewZoom(direction) {
  const center = getStageCenter();
  setPreviewZoom(previewZoom * (direction > 0 ? 1.18 : 1 / 1.18), center.x, center.y);
}

function fitPreviewToStage() {
  if (selectedFiles.length === 0) {
    return;
  }

  const settings = getSettings();
  const maxWidth = Math.max(180, previewStage.clientWidth - 32);
  const maxHeight = Math.max(180, previewStage.clientHeight - 32);
  fitPreviewZoom = clamp(Math.min(maxWidth / settings.width, maxHeight / settings.height), minPreviewZoom, 1);
  previewZoom = fitPreviewZoom;
  isPreviewZoomManual = false;
  renderEditablePreview({ preserveViewport: false });
  centerPreview();
}

function setPreviewZoom(nextZoom, clientX, clientY) {
  if (selectedFiles.length === 0) {
    return;
  }

  const previousZoom = previewZoom;
  previewZoom = clamp(nextZoom, minPreviewZoom, maxPreviewZoom);
  isPreviewZoomManual = Math.abs(previewZoom - fitPreviewZoom) > 0.01;

  if (Math.abs(previewZoom - previousZoom) < 0.001) {
    updatePreviewZoomControls();
    return;
  }

  const before = getStagePoint(clientX, clientY);
  renderEditablePreview();
  const ratio = previewZoom / previousZoom;
  previewStage.scrollLeft = before.scrollLeft * ratio - before.offsetX;
  previewStage.scrollTop = before.scrollTop * ratio - before.offsetY;
}

function getStagePoint(clientX, clientY) {
  const rect = previewStage.getBoundingClientRect();
  return {
    offsetX: clientX - rect.left,
    offsetY: clientY - rect.top,
    scrollLeft: previewStage.scrollLeft + clientX - rect.left,
    scrollTop: previewStage.scrollTop + clientY - rect.top
  };
}

function capturePreviewViewport() {
  return {
    scrollLeft: previewStage.scrollLeft,
    scrollTop: previewStage.scrollTop
  };
}

function restorePreviewViewport(viewport) {
  previewStage.scrollLeft = viewport.scrollLeft;
  previewStage.scrollTop = viewport.scrollTop;
}

function centerPreview() {
  previewStage.scrollLeft = Math.max(0, (previewStage.scrollWidth - previewStage.clientWidth) / 2);
  previewStage.scrollTop = Math.max(0, (previewStage.scrollHeight - previewStage.clientHeight) / 2);
}

function getStageCenter() {
  const rect = previewStage.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function updatePreviewZoomControls() {
  previewZoomLabel.textContent = selectedFiles.length ? `${Math.round(previewZoom * 100)}%` : "--";
  previewZoomOut.disabled = selectedFiles.length === 0 || previewZoom <= minPreviewZoom + 0.005;
  previewZoomIn.disabled = selectedFiles.length === 0 || previewZoom >= maxPreviewZoom - 0.005;
  previewZoomFit.disabled = selectedFiles.length === 0 || !isPreviewZoomManual;
}

function beginPreviewPan(event) {
  if (event.button !== 0 || selectedFiles.length === 0 || dragState) {
    return;
  }

  if (event.target.closest(".collage-tile, .preview-zoom-controls, button, input, a")) {
    return;
  }

  const canPan = previewStage.scrollWidth > previewStage.clientWidth || previewStage.scrollHeight > previewStage.clientHeight;
  if (!canPan) {
    return;
  }

  previewPanState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: previewStage.scrollLeft,
    scrollTop: previewStage.scrollTop
  };

  previewStage.setPointerCapture(event.pointerId);
  previewStage.classList.add("is-panning");
  previewStage.addEventListener("pointermove", movePreviewPan);
  previewStage.addEventListener("pointerup", endPreviewPan);
  previewStage.addEventListener("pointercancel", cancelPreviewPan);
  event.preventDefault();
}

function movePreviewPan(event) {
  if (!previewPanState || event.pointerId !== previewPanState.pointerId) {
    return;
  }

  previewStage.scrollLeft = previewPanState.scrollLeft - (event.clientX - previewPanState.startX);
  previewStage.scrollTop = previewPanState.scrollTop - (event.clientY - previewPanState.startY);
}

function endPreviewPan(event) {
  if (!previewPanState || event.pointerId !== previewPanState.pointerId) {
    return;
  }

  cleanupPreviewPan();
}

function cancelPreviewPan() {
  cleanupPreviewPan();
}

function cleanupPreviewPan() {
  previewStage.classList.remove("is-panning");
  previewStage.removeEventListener("pointermove", movePreviewPan);
  previewStage.removeEventListener("pointerup", endPreviewPan);
  previewStage.removeEventListener("pointercancel", cancelPreviewPan);
  previewPanState = null;
}

function createAutoTemplateOption() {
  return { id: "auto", name: "自动网格", cells: [] };
}

function createEqualGridTemplateOption() {
  return { id: "equal-grid", name: "等格网格", cells: [] };
}

function createAutoTemplatePreview() {
  const preview = document.createElement("span");
  preview.className = "template-preview template-preview-auto";
  const cells = [
    [0, 0, 3, 2],
    [3, 0, 3, 3],
    [0, 2, 2, 3],
    [2, 2, 1, 2],
    [3, 3, 2, 2],
    [5, 3, 1, 3],
    [0, 5, 3, 1],
    [3, 5, 2, 1]
  ];

  cells.forEach(cell => {
    const block = document.createElement("span");
    block.style.gridColumn = `${cell[0] + 1} / span ${cell[2]}`;
    block.style.gridRow = `${cell[1] + 1} / span ${cell[3]}`;
    preview.appendChild(block);
  });

  return preview;
}

function createEqualGridTemplatePreview() {
  const preview = document.createElement("span");
  preview.className = "template-preview";

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const block = document.createElement("span");
      block.style.gridColumn = `${column * 2 + 1} / span 2`;
      block.style.gridRow = `${row * 2 + 1} / span 2`;
      preview.appendChild(block);
    }
  }

  return preview;
}

function beginTileDrag(event, index) {
  if (event.button !== 0) {
    return;
  }

  const tile = event.currentTarget;
  tile.setPointerCapture(event.pointerId);
  dragState = {
    index,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    moved: false,
    swapMode: false,
    longPressTimer: window.setTimeout(() => enterSwapMode(tile), longPressMs),
    offsetX: selectedFiles[index].offsetX,
    offsetY: selectedFiles[index].offsetY,
    scale: selectedFiles[index].scale || 1
  };

  tile.classList.add("is-dragging");
  tile.addEventListener("pointermove", moveTileDrag);
  tile.addEventListener("pointerup", endTileDrag);
  tile.addEventListener("pointercancel", cancelTileDrag);
  event.preventDefault();
}

function moveTileDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) {
    return;
  }

  const dx = event.clientX - dragState.startX;
  const dy = event.clientY - dragState.startY;
  const distance = Math.hypot(dx, dy);
  dragState.moved = dragState.moved || distance > 4;

  if (dragState.moved && !dragState.swapMode) {
    clearTimeout(dragState.longPressTimer);
  }

  dragState.lastX = event.clientX;
  dragState.lastY = event.clientY;

  if (dragState.swapMode) {
    updateSwapHover(event.clientX, event.clientY, dragState.index);
    return;
  }

  const item = selectedFiles[dragState.index];
  const rect = currentLayout[dragState.index];
  const image = event.currentTarget.querySelector("img");
  const crop = getCropMetrics(image, rect, item.scale || 1);
  item.offsetX = clamp(dragState.offsetX - dx / Math.max(1, crop.extraX / 2), -1, 1);
  item.offsetY = clamp(dragState.offsetY - dy / Math.max(1, crop.extraY / 2), -1, 1);

  applyImagePlacement(image, item, rect);
}

function endTileDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) {
    return;
  }

  const sourceIndex = dragState.index;
  clearTimeout(dragState.longPressTimer);
  const targetIndex = getTileIndexAt(event.clientX, event.clientY, sourceIndex);
  const wasSwapMode = dragState.swapMode;
  cleanupDragListeners(event.currentTarget);

  if (wasSwapMode && Number.isInteger(targetIndex) && targetIndex !== sourceIndex) {
    selectedFiles[sourceIndex].offsetX = dragState.offsetX;
    selectedFiles[sourceIndex].offsetY = dragState.offsetY;
    selectedFiles[sourceIndex].scale = dragState.scale;
    swapFiles(sourceIndex, targetIndex);
    renderEditablePreview();
    showFloatingMessage("已交换图片", event);
  } else if (dragState.moved) {
    showFloatingMessage("已调整裁剪", event);
  }

  dragState = null;
}

function cancelTileDrag(event) {
  if (dragState) {
    clearTimeout(dragState.longPressTimer);
  }

  cleanupDragListeners(event.currentTarget);
  dragState = null;
  renderEditablePreview();
}

function cleanupDragListeners(tile) {
  tile.classList.remove("is-dragging");
  tile.classList.remove("is-swap-source");
  clearSwapHover();
  tile.removeEventListener("pointermove", moveTileDrag);
  tile.removeEventListener("pointerup", endTileDrag);
  tile.removeEventListener("pointercancel", cancelTileDrag);
}

function swapFiles(sourceIndex, targetIndex) {
  const source = selectedFiles[sourceIndex];
  selectedFiles[sourceIndex] = selectedFiles[targetIndex];
  selectedFiles[targetIndex] = source;
}

function enterSwapMode(tile) {
  if (!dragState) {
    return;
  }

  dragState.swapMode = true;
  tile.classList.add("is-swap-source");
  showFloatingMessage("拖到另一格交换");
  updateSwapHover(dragState.lastX, dragState.lastY, dragState.index);
}

function updateSwapHover(clientX, clientY, sourceIndex) {
  clearSwapHover();
  const targetIndex = getTileIndexAt(clientX, clientY, sourceIndex);
  if (Number.isInteger(targetIndex) && targetIndex !== sourceIndex) {
    const target = editableCollage.querySelector(`.collage-tile[data-index="${targetIndex}"]`);
    target?.classList.add("is-swap-target");
  }
}

function clearSwapHover() {
  editableCollage.querySelectorAll(".is-swap-target").forEach(tile => {
    tile.classList.remove("is-swap-target");
  });
}

function getTileIndexAt(clientX, clientY, fallbackIndex) {
  const targetTile = document.elementFromPoint(clientX, clientY)?.closest(".collage-tile");
  return targetTile ? Number(targetTile.dataset.index) : fallbackIndex;
}

function zoomTileImage(event, index) {
  if (!canWheelZoomTile(event)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  const item = selectedFiles[index];
  const rect = currentLayout[index];
  const tile = event.currentTarget;
  const image = tile.querySelector("img");
  const previousScale = item.scale || 1;
  const zoomFactor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
  item.scale = clamp(previousScale * zoomFactor, 1, 4);

  if (item.scale === 1) {
    item.offsetX = 0;
    item.offsetY = 0;
  }

  applyImagePlacement(image, item, rect);
}

function canWheelZoomTile(event) {
  return Boolean(event.target.closest(".collage-tile"));
}

function applyImagePlacement(image, item, rect) {
  const crop = getCropMetrics(image, rect, item.scale || 1);
  const translateX = -crop.extraX * (item.offsetX + 1) / 2;
  const translateY = -crop.extraY * (item.offsetY + 1) / 2;

  image.style.width = `${crop.width}px`;
  image.style.height = `${crop.height}px`;
  image.style.transform = `translate(${translateX}px, ${translateY}px)`;
}

function getCropMetrics(image, rect, scale) {
  const naturalWidth = image.naturalWidth || 1;
  const naturalHeight = image.naturalHeight || 1;
  const imageAspect = naturalWidth / naturalHeight;
  const rectAspect = rect.width / rect.height;
  let width;
  let height;

  if (imageAspect > rectAspect) {
    height = rect.height * scale;
    width = height * imageAspect;
  } else {
    width = rect.width * scale;
    height = width / imageAspect;
  }

  return {
    width,
    height,
    extraX: Math.max(0, width - rect.width),
    extraY: Math.max(0, height - rect.height)
  };
}

function schedulePreviewRender() {
  if (selectedFiles.length === 0) {
    return;
  }

  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    renderEditablePreview();
  }, 120);
}

async function exportAndDownload() {
  if (selectedFiles.length === 0) {
    return;
  }

  generateButton.disabled = true;
  generateButton.textContent = "生成中...";

  const formData = new FormData(settingsForm);
  const templateItem = getSelectedTemplate();
  if (templateItem) {
    formData.set("templateColumns", String(templateItem.columns || 6));
    formData.set("templateRows", String(templateItem.rows || 6));
    formData.set("templateCells", JSON.stringify(templateItem.cells.map(cell => ({
      column: cell[0],
      row: cell[1],
      columnSpan: cell[2],
      rowSpan: cell[3]
    }))));
  }

  formData.set("placements", JSON.stringify(selectedFiles.map(item => ({
    offsetX: item.offsetX,
    offsetY: item.offsetY,
    scale: item.scale || 1
  }))));
  selectedFiles.forEach(item => formData.append("images", item.file));

  try {
    const response = await fetch("/api/collage", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "生成失败，请检查图片格式。" }));
      throw new Error(payload.error || "生成失败，请检查图片格式。");
    }

    const blob = await response.blob();
    downloadBlob(blob);
    showFloatingMessage("已开始下载");
  } catch (error) {
    showFloatingMessage("生成失败");
    console.error(error.message === "Failed to fetch"
      ? "图片数据较大或服务暂时不可用，请稍后重试。"
      : error.message);
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = "生成拼图";
  }
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${createLocalDateTimeFileName()}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function createLocalDateTimeFileName() {
  const formatted = new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(new Date());

  return sanitizeFileName(formatted) || "collage";
}

function sanitizeFileName(value) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim();
}

function updatePointerPosition(event) {
  lastPointerPosition = { x: event.clientX, y: event.clientY };
  moveFloatingMessage(lastPointerPosition.x, lastPointerPosition.y);
}

function showFloatingMessage(message, event) {
  const position = event
    ? { x: event.clientX, y: event.clientY }
    : lastPointerPosition;
  let bubble = document.querySelector("#floatingMessage");
  if (!bubble) {
    bubble = document.createElement("div");
    bubble.id = "floatingMessage";
    bubble.className = "floating-message";
    document.body.appendChild(bubble);
  }

  clearTimeout(floatingMessageTimer);
  bubble.textContent = message;
  bubble.classList.add("is-visible");
  moveFloatingMessage(position.x, position.y);
  floatingMessageTimer = window.setTimeout(() => {
    bubble.classList.remove("is-visible");
  }, 1500);
}

function moveFloatingMessage(x, y) {
  const bubble = document.querySelector("#floatingMessage");
  if (!bubble || !bubble.classList.contains("is-visible")) {
    return;
  }

  const margin = 12;
  const offset = 18;
  const rect = bubble.getBoundingClientRect();
  const left = clamp(x + offset, margin, window.innerWidth - rect.width - margin);
  const top = clamp(y + offset, margin, window.innerHeight - rect.height - margin);
  bubble.style.transform = `translate(${left}px, ${top}px)`;
}

function createLayout(count, settings) {
  if (isEqualGridTemplate(templateInput.value)) {
    return createEqualGridLayout(count, settings);
  }

  if (count > 1) {
    const item = getSelectedTemplate();
    if (item && item.cells.length === count) {
      return createTemplateLayout(item, settings);
    }
  }

  return createAutoGridLayout(count, settings);
}

function createEqualGridLayout(count, settings) {
  const content = getContentBounds(settings);
  const ratio = clamp(settings.equalGridRatio || 1, 0.35, 2.8);
  const columns = chooseEqualGridColumns(count, content, settings.gap, ratio);
  const rows = Math.ceil(count / columns);
  const cellWidthByContent = (content.width - settings.gap * Math.max(0, columns - 1)) / columns;
  const cellHeightByContent = (content.height - settings.gap * Math.max(0, rows - 1)) / rows;
  const cellWidth = Math.max(1, Math.min(cellWidthByContent, cellHeightByContent * ratio));
  const cellHeight = Math.max(1, cellWidth / ratio);
  const gridHeight = cellHeight * rows + settings.gap * Math.max(0, rows - 1);
  const y = content.y + Math.max(0, (content.height - gridHeight) / 2);
  const rectangles = [];

  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const remaining = count - row * columns;
    const cellsInRow = Math.min(columns, remaining);
    const rowWidth = cellWidth * cellsInRow + settings.gap * Math.max(0, cellsInRow - 1);
    const x = content.x + Math.max(0, (content.width - rowWidth) / 2);

    rectangles.push({
      x: x + column * (cellWidth + settings.gap),
      y: y + row * (cellHeight + settings.gap),
      width: cellWidth,
      height: cellHeight
    });
  }

  return rectangles;
}

function chooseEqualGridColumns(count, content, gap, ratio) {
  let bestColumns = 1;
  let bestScore = Number.MAX_VALUE;

  for (let columns = 1; columns <= count; columns += 1) {
    const rows = Math.ceil(count / columns);
    const cellWidthByContent = (content.width - gap * Math.max(0, columns - 1)) / columns;
    const cellHeightByContent = (content.height - gap * Math.max(0, rows - 1)) / rows;
    if (cellWidthByContent <= 0 || cellHeightByContent <= 0) {
      continue;
    }

    const cellWidth = Math.min(cellWidthByContent, cellHeightByContent * ratio);
    const cellHeight = cellWidth / ratio;
    const gridWidth = cellWidth * columns + gap * Math.max(0, columns - 1);
    const gridHeight = cellHeight * rows + gap * Math.max(0, rows - 1);
    const unusedArea = Math.max(0, content.width * content.height - gridWidth * gridHeight) / Math.max(1, content.width * content.height);
    const shapeScore = Math.abs(Math.log((gridWidth / Math.max(1, gridHeight)) / (content.width / Math.max(1, content.height))));
    const balanceScore = getEqualGridBalanceScore(count, columns);
    const score = unusedArea + shapeScore * 0.22 + balanceScore;

    if (score < bestScore) {
      bestScore = score;
      bestColumns = columns;
    }
  }

  return bestColumns;
}

function getEqualGridBalanceScore(count, columns) {
  const rows = Math.ceil(count / columns);
  const lastRowCount = count - columns * (rows - 1);
  const rowDifference = columns - lastRowCount;
  const orphanPenalty = rows > 1 && lastRowCount === 1 ? 1.2 : 0;
  const sparseLastRowPenalty = rows > 1 ? (rowDifference / columns) ** 2 * 0.9 : 0;
  const columnRowBalance = Math.abs(columns - rows) / Math.max(columns, rows) * 0.08;

  return orphanPenalty + sparseLastRowPenalty + columnRowBalance;
}

function createTemplateLayout(item, settings) {
  const content = getContentBounds(settings);
  const columns = item.columns || 6;
  const rows = item.rows || 6;
  const unitWidth = (content.width - settings.gap * (columns - 1)) / columns;
  const unitHeight = (content.height - settings.gap * (rows - 1)) / rows;

  return item.cells.map(cell => ({
    x: content.x + cell[0] * (unitWidth + settings.gap),
    y: content.y + cell[1] * (unitHeight + settings.gap),
    width: cell[2] * unitWidth + (cell[2] - 1) * settings.gap,
    height: cell[3] * unitHeight + (cell[3] - 1) * settings.gap
  }));
}

function createAutoGridLayout(count, settings) {
  const content = getContentBounds(settings);
  const aspects = selectedFiles.slice(0, count).map(item => clampAspect(item.aspect || 1));
  const rows = createAspectRows(aspects, content, settings);
  const totalGapHeight = settings.gap * Math.max(0, rows.length - 1);
  const availableHeight = Math.max(1, content.height - totalGapHeight);
  const naturalHeights = rows.map(row => getNaturalRowHeight(row, content.width, settings.gap));
  const totalNaturalHeight = Math.max(1, naturalHeights.reduce((sum, height) => sum + height, 0));
  const heightScale = Math.min(1, availableHeight / totalNaturalHeight);
  const finalHeight = totalNaturalHeight * heightScale + totalGapHeight;
  let y = content.y + Math.max(0, (content.height - finalHeight) / 2);
  const rectangles = [];

  rows.forEach((row, rowIndex) => {
    const rowHeight = Math.max(1, naturalHeights[rowIndex] * heightScale);
    const widths = [];
    let rowWidth = settings.gap * Math.max(0, row.count - 1);

    for (let offset = 0; offset < row.count; offset += 1) {
      const width = aspects[row.start + offset] * rowHeight;
      widths.push(width);
      rowWidth += width;
    }

    let x = content.x + Math.max(0, (content.width - rowWidth) / 2);
    widths.forEach(width => {
      rectangles.push({ x, y, width, height: rowHeight });
      x += width + settings.gap;
    });

    y += rowHeight + settings.gap;
  });

  return rectangles;
}

function createAspectRows(aspects, content, settings) {
  const count = aspects.length;
  if (count === 1) {
    return [{ start: 0, count: 1, aspectSum: aspects[0] }];
  }

  const canvasAspect = {
    Square: 1,
    Portrait: 0.75,
    Landscape: 1.6
  }[settings.mode] || content.width / content.height;
  const targetRows = Math.max(1, Math.round(Math.sqrt(count / Math.max(0.2, canvasAspect))));
  const minRows = Math.max(1, targetRows - 2);
  const maxRows = Math.min(count, targetRows + 2);
  let bestRows = [];
  let bestScore = Number.MAX_VALUE;

  for (let rowCount = minRows; rowCount <= maxRows; rowCount += 1) {
    const rows = partitionRows(aspects, content, settings.gap, rowCount);
    const rowHeights = rows.map(row => getNaturalRowHeight(row, content.width, settings.gap));
    const totalHeight = rowHeights.reduce((sum, height) => sum + height, 0) + settings.gap * Math.max(0, rows.length - 1);
    const heightScore = Math.abs(Math.log(totalHeight / Math.max(1, content.height)));
    const balanceScore = rowHeights.reduce((sum, height) => {
      return sum + Math.abs(Math.log(height / Math.max(1, content.height / rowCount)));
    }, 0) / rowHeights.length;
    const score = heightScore + balanceScore * 0.35;

    if (score < bestScore) {
      bestScore = score;
      bestRows = rows;
    }
  }

  return bestRows;
}

function partitionRows(aspects, content, gap, rowCount) {
  const count = aspects.length;
  const prefix = [0];
  for (let index = 0; index < count; index += 1) {
    prefix[index + 1] = prefix[index] + aspects[index];
  }

  const costs = Array.from({ length: rowCount + 1 }, () => Array(count + 1).fill(Number.POSITIVE_INFINITY));
  const breaks = Array.from({ length: rowCount + 1 }, () => Array(count + 1).fill(0));
  const targetHeight = Math.max(1, (content.height - gap * Math.max(0, rowCount - 1)) / rowCount);
  costs[0][0] = 0;

  for (let row = 1; row <= rowCount; row += 1) {
    for (let index = row; index <= count; index += 1) {
      for (let previous = row - 1; previous < index; previous += 1) {
        const aspectSum = prefix[index] - prefix[previous];
        const itemCount = index - previous;
        const naturalHeight = Math.max(1, (content.width - gap * Math.max(0, itemCount - 1)) / aspectSum);
        const rowScore = Math.log(naturalHeight / targetHeight) ** 2;
        const score = costs[row - 1][previous] + rowScore;

        if (score < costs[row][index]) {
          costs[row][index] = score;
          breaks[row][index] = previous;
        }
      }
    }
  }

  const rows = [];
  let end = count;
  for (let row = rowCount; row >= 1; row -= 1) {
    const start = breaks[row][end];
    rows.push({ start, count: end - start, aspectSum: prefix[end] - prefix[start] });
    end = start;
  }

  return rows.reverse();
}

function getNaturalRowHeight(row, contentWidth, gap) {
  return Math.max(1, (contentWidth - gap * Math.max(0, row.count - 1)) / row.aspectSum);
}

function getSelectedTemplate() {
  return getTemplatesForCurrentCount().find(item => item.id === templateInput.value) || null;
}

function isEqualGridTemplate(templateId) {
  return templateId === "equal-grid";
}

function updateEqualGridControl() {
  const isVisible = selectedFiles.length > 0 && isEqualGridTemplate(templateInput.value);
  equalGridControl.classList.toggle("is-hidden", !isVisible);
  equalGridRatioValue.textContent = formatRatio(readNumber(new FormData(settingsForm), "equalGridRatio", 1));
}

function formatRatio(value) {
  const ratio = clamp(value, 0.35, 2.8);
  if (Math.abs(ratio - 1) < 0.025) {
    return "1:1";
  }

  if (ratio > 1) {
    return `${ratio.toFixed(2)}:1`;
  }

  return `1:${(1 / ratio).toFixed(2)}`;
}

function getTemplatesForCurrentCount() {
  return templates[selectedFiles.length] || [];
}

function clampAspect(aspect) {
  return clamp(Number.isFinite(aspect) ? aspect : 1, 0.2, 5);
}

function getContentBounds(settings) {
  return {
    x: settings.padding,
    y: settings.padding,
    width: Math.max(1, settings.width - settings.padding * 2),
    height: Math.max(1, settings.height - settings.padding * 2)
  };
}

function getSettings() {
  const formData = new FormData(settingsForm);
  return {
    width: readNumber(formData, "width", 1080),
    height: readNumber(formData, "height", 1920),
    gap: readNumber(formData, "gap", 18),
    padding: readNumber(formData, "padding", 28),
    radius: readNumber(formData, "radius", 18),
    background: formData.get("background") || "#ffffff",
    mode: formData.get("mode") || "Auto",
    equalGridRatio: readNumber(formData, "equalGridRatio", 1)
  };
}

function readNumber(formData, key, fallback) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function applyCanvasMode(mode) {
  const preset = canvasPresets[mode];
  if (!preset) {
    return;
  }

  settingsForm.elements.width.value = String(preset[0]);
  settingsForm.elements.height.value = String(preset[1]);
}

function resetPlacements() {
  selectedFiles.forEach(item => {
    item.offsetX = 0;
    item.offsetY = 0;
    item.scale = 1;
  });
}

function resetPreviewZoom() {
  previewZoom = 1;
  isPreviewZoomManual = false;
  updatePreviewZoomControls();
}

function resetPreview() {
  clearTimeout(renderTimer);
  clearTimeout(floatingMessageTimer);
  editableCollage.replaceChildren();
  editableCollage.classList.remove("has-collage");
  emptyState.classList.remove("is-hidden");
  generateButton.disabled = false;
  generateButton.textContent = "生成拼图";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
