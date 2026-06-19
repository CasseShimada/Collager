const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const thumbStrip = document.querySelector("#thumbStrip");
const settingsForm = document.querySelector("#settingsForm");
const generateButton = document.querySelector("#generateButton");
const clearButton = document.querySelector("#clearButton");
const statusTitle = document.querySelector("#statusTitle");
const statusText = document.querySelector("#statusText");
const emptyState = document.querySelector("#emptyState");
const downloadLink = document.querySelector("#downloadLink");
const templateGrid = document.querySelector("#templateGrid");
const templateInput = document.querySelector("#templateInput");
const templateCountLabel = document.querySelector("#templateCountLabel");
const equalGridControl = document.querySelector("#equalGridControl");
const equalGridRatioValue = document.querySelector("#equalGridRatioValue");
const editableCollage = document.querySelector("#editableCollage");

const templates = {
  2: [
    template("2-vsplit", "竖分", [[0, 0, 3, 6], [3, 0, 3, 6]]),
    template("2-hsplit", "横分", [[0, 0, 6, 3], [0, 3, 6, 3]]),
    template("2-poster", "海报", [[0, 0, 6, 4], [0, 4, 6, 2]]),
    template("2-corner", "角落", [[0, 0, 4, 6], [4, 3, 2, 3]]),
    template("2-offset", "叠放", [[0, 0, 4, 4], [2, 2, 4, 4]])
  ],
  3: [
    template("3-left", "主图左", [[0, 0, 3, 6], [3, 0, 3, 3], [3, 3, 3, 3]]),
    template("3-bottom", "底栏", [[0, 0, 6, 4], [0, 4, 3, 2], [3, 4, 3, 2]]),
    template("3-top", "顶部双图", [[0, 0, 3, 3], [3, 0, 3, 3], [0, 3, 6, 3]]),
    template("3-columns", "三列", [[0, 0, 2, 6], [2, 0, 2, 6], [4, 0, 2, 6]]),
    template("3-rows", "三行", [[0, 0, 6, 2], [0, 2, 6, 2], [0, 4, 6, 2]]),
    template("3-feature", "大图", [[0, 0, 4, 6], [4, 0, 2, 3], [4, 3, 2, 3]]),
    template("3-tall-side", "竖边栏", [[0, 0, 4, 6], [4, 0, 2, 3], [4, 3, 2, 3]]),
    template("3-stacked", "双横栏", [[0, 0, 6, 2], [0, 2, 6, 2], [0, 4, 6, 2]])
  ],
  4: [
    template("4-grid", "四宫格", [[0, 0, 3, 3], [3, 0, 3, 3], [0, 3, 3, 3], [3, 3, 3, 3]]),
    template("4-mosaic", "拼接", [[0, 0, 4, 4], [4, 0, 2, 2], [4, 2, 2, 2], [0, 4, 6, 2]]),
    template("4-side", "侧栏", [[0, 0, 3, 6], [3, 0, 3, 2], [3, 2, 3, 2], [3, 4, 3, 2]]),
    template("4-banner", "横幅", [[0, 0, 6, 2], [0, 2, 2, 4], [2, 2, 2, 4], [4, 2, 2, 4]]),
    template("4-stripes", "条纹", [[0, 0, 6, 1], [0, 1, 6, 2], [0, 3, 6, 1], [0, 4, 6, 2]]),
    template("4-vertical", "竖条", [[0, 0, 2, 6], [2, 0, 1, 6], [3, 0, 1, 6], [4, 0, 2, 6]]),
    template("4-stack", "堆叠", [[0, 0, 6, 2], [0, 2, 6, 2], [0, 4, 3, 2], [3, 4, 3, 2]]),
    template("4-left-mini", "左大右三", [[0, 0, 3, 6], [3, 0, 3, 2], [3, 2, 3, 2], [3, 4, 3, 2]]),
    template("4-top-trio", "三小一横", [[0, 0, 2, 3], [2, 0, 2, 3], [4, 0, 2, 3], [0, 3, 6, 3]]),
    template("4-frame", "框形", [[0, 0, 3, 3], [3, 0, 3, 2], [0, 3, 2, 3], [2, 2, 4, 4]])
  ],
  5: [
    template("5-grid", "五格", [[0, 0, 2, 3], [2, 0, 2, 3], [4, 0, 2, 3], [0, 3, 3, 3], [3, 3, 3, 3]]),
    template("5-hero", "主图", [[0, 0, 4, 4], [4, 0, 2, 2], [4, 2, 2, 2], [0, 4, 3, 2], [3, 4, 3, 2]]),
    template("5-right", "右栏", [[0, 0, 3, 6], [3, 0, 3, 2], [3, 2, 3, 2], [3, 4, 2, 2], [5, 4, 1, 2]]),
    template("5-banner", "横向", [[0, 0, 6, 2], [0, 2, 3, 2], [3, 2, 3, 2], [0, 4, 3, 2], [3, 4, 3, 2]]),
    template("5-bottom", "大上图", [[0, 0, 6, 3], [0, 3, 2, 3], [2, 3, 2, 3], [4, 3, 1, 3], [5, 3, 1, 3]]),
    template("5-ladder", "阶梯", [[0, 0, 3, 2], [3, 0, 3, 3], [0, 2, 3, 2], [3, 3, 3, 3], [0, 4, 3, 2]]),
    template("5-stripes", "五横条", [[0, 0, 6, 1], [0, 1, 6, 1], [0, 2, 6, 1], [0, 3, 6, 1], [0, 4, 6, 2]]),
    template("5-center", "中心块", [[0, 0, 2, 3], [2, 0, 2, 2], [4, 0, 2, 3], [2, 2, 2, 2], [0, 3, 6, 3]])
  ],
  6: [
    template("6-grid", "六宫格", [[0, 0, 2, 3], [2, 0, 2, 3], [4, 0, 2, 3], [0, 3, 2, 3], [2, 3, 2, 3], [4, 3, 2, 3]]),
    template("6-feature", "错落", [[0, 0, 3, 3], [3, 0, 3, 2], [3, 2, 3, 2], [0, 3, 2, 3], [2, 3, 2, 3], [4, 4, 2, 2]]),
    template("6-banner", "横幅", [[0, 0, 6, 2], [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 2, 2], [0, 4, 3, 2], [3, 4, 3, 2]]),
    template("6-left", "主图左", [[0, 0, 3, 6], [3, 0, 3, 2], [3, 2, 3, 2], [3, 4, 1, 2], [4, 4, 1, 2], [5, 4, 1, 2]]),
    template("6-stripes", "竖条", [[0, 0, 1, 6], [1, 0, 1, 6], [2, 0, 1, 6], [3, 0, 1, 6], [4, 0, 1, 6], [5, 0, 1, 6]]),
    template("6-mosaic", "拼接", [[0, 0, 2, 2], [2, 0, 4, 2], [0, 2, 3, 2], [3, 2, 3, 2], [0, 4, 2, 2], [2, 4, 4, 2]]),
    template("6-top-large", "上大下排", [[0, 0, 6, 3], [0, 3, 1, 3], [1, 3, 1, 3], [2, 3, 1, 3], [3, 3, 1, 3], [4, 3, 2, 3]]),
    template("6-right-large", "右大左列", [[0, 0, 2, 2], [0, 2, 2, 2], [0, 4, 2, 2], [2, 0, 2, 3], [2, 3, 2, 3], [4, 0, 2, 6]])
  ],
  7: [
    denseTemplate("7-balanced", "均衡", [[0, 0, 3, 3], [3, 0, 3, 3], [0, 3, 2, 3], [2, 3, 2, 3], [4, 3, 2, 2]]),
    denseTemplate("7-side", "侧栏", [[0, 0, 2, 6], [2, 0, 2, 3], [4, 0, 2, 3], [2, 3, 2, 3], [4, 3, 2, 2]]),
    denseTemplate("7-banner", "横幅", [[0, 0, 6, 2], [0, 2, 3, 2], [3, 2, 3, 2], [0, 4, 2, 2], [2, 4, 3, 2]])
  ],
  8: [
    denseTemplate("8-hero", "主图", [[0, 0, 3, 3], [3, 0, 3, 2], [0, 3, 2, 3], [2, 3, 2, 3], [4, 2, 2, 3]]),
    denseTemplate("8-banner", "横幅", [[0, 0, 6, 2], [0, 2, 2, 4], [2, 2, 2, 3], [4, 2, 2, 3]]),
    denseTemplate("8-mosaic", "拼接", [[0, 0, 3, 3], [3, 0, 3, 3], [0, 3, 2, 2], [2, 3, 2, 2], [4, 3, 2, 2], [0, 5, 4, 1]])
  ],
  9: [
    template("9-grid", "九宫格", [[0, 0, 2, 2], [2, 0, 2, 2], [4, 0, 2, 2], [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 2, 2], [0, 4, 2, 2], [2, 4, 2, 2], [4, 4, 2, 2]]),
    denseTemplate("9-hero", "主图", [[0, 0, 3, 3], [3, 0, 3, 3], [0, 3, 2, 3], [2, 3, 2, 2], [4, 3, 2, 2]]),
    denseTemplate("9-banner", "横幅", [[0, 0, 6, 2], [0, 2, 2, 4], [2, 2, 2, 2], [4, 2, 2, 2], [2, 4, 2, 2]])
  ],
  10: [
    denseTemplate("10-hero", "主图", [[0, 0, 3, 3], [3, 0, 3, 2], [0, 3, 2, 3], [2, 3, 2, 3], [4, 2, 2, 2]]),
    denseTemplate("10-stripes", "条带", [[0, 0, 6, 1], [0, 1, 6, 1], [0, 2, 2, 4], [2, 2, 2, 2], [4, 2, 2, 2], [2, 4, 2, 2]]),
    denseTemplate("10-frame", "框形", [[0, 0, 6, 2], [0, 2, 2, 2], [4, 2, 2, 2], [0, 4, 2, 2], [2, 4, 2, 2], [4, 4, 2, 2]])
  ],
  11: [
    denseTemplate("11-hero", "主图", [[0, 0, 3, 3], [3, 0, 3, 2], [0, 3, 2, 3], [2, 3, 2, 2], [4, 2, 2, 2], [4, 4, 1, 2]]),
    denseTemplate("11-banner", "横幅", [[0, 0, 6, 2], [0, 2, 2, 3], [2, 2, 2, 3], [4, 2, 2, 2], [4, 4, 2, 1]]),
    denseTemplate("11-stack", "堆叠", [[0, 0, 3, 2], [3, 0, 3, 2], [0, 2, 2, 3], [2, 2, 2, 2], [4, 2, 2, 2], [2, 4, 2, 2], [4, 4, 2, 1]])
  ],
  12: [
    denseTemplate("12-hero", "主图", [[0, 0, 3, 3], [3, 0, 3, 2], [0, 3, 2, 3], [2, 3, 2, 2], [4, 2, 2, 2]]),
    denseTemplate("12-stripes", "条带", [[0, 0, 6, 1], [0, 1, 6, 1], [0, 2, 2, 4], [2, 2, 2, 2], [4, 2, 2, 2], [2, 4, 2, 1]]),
    denseTemplate("12-mosaic", "拼接", [[0, 0, 3, 2], [3, 0, 3, 2], [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 2, 2], [0, 4, 2, 2], [2, 4, 3, 1]])
  ],
  13: [
    denseTemplate("13-hero", "主图", [[0, 0, 3, 3], [3, 0, 3, 2], [0, 3, 2, 2], [2, 3, 2, 2], [4, 2, 2, 2], [4, 4, 1, 2]]),
    denseTemplate("13-mosaic", "拼接", [[0, 0, 3, 2], [3, 0, 3, 2], [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 2, 2], [0, 4, 2, 2], [2, 4, 2, 1]]),
    denseTemplate("13-grid", "网格", [[0, 0, 2, 2], [2, 0, 2, 2], [4, 0, 2, 2], [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 2, 2], [0, 4, 2, 2], [2, 4, 3, 1]])
  ],
  14: [
    denseTemplate("14-frame", "框形", [[0, 0, 3, 2], [3, 0, 3, 2], [0, 2, 2, 3], [2, 2, 2, 2], [4, 2, 2, 2], [2, 4, 2, 1]]),
    denseTemplate("14-mosaic", "拼接", [[0, 0, 3, 2], [3, 0, 3, 2], [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 2, 2], [0, 4, 3, 1], [3, 4, 2, 1]]),
    denseTemplate("14-grid", "网格", [[0, 0, 2, 2], [2, 0, 2, 2], [4, 0, 2, 2], [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 2, 2], [0, 4, 3, 1], [3, 4, 3, 1]])
  ],
  15: [
    denseTemplate("15-frame", "框形", [[0, 0, 3, 2], [3, 0, 3, 2], [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 2, 2], [0, 4, 3, 1]]),
    denseTemplate("15-grid", "网格", [[0, 0, 2, 2], [2, 0, 2, 2], [4, 0, 2, 2], [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 2, 2], [0, 4, 2, 2]]),
    denseTemplate("15-mosaic", "拼接", [[0, 0, 2, 2], [2, 0, 2, 2], [4, 0, 2, 2], [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 2, 2], [0, 4, 3, 1], [3, 4, 2, 1]])
  ],
  16: [
    denseTemplate("16-frame", "框形", [[0, 0, 3, 2], [3, 0, 3, 2], [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 2, 1], [0, 4, 2, 2]]),
    denseTemplate("16-grid", "网格", [[0, 0, 2, 2], [2, 0, 2, 2], [4, 0, 2, 2], [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 2, 2], [0, 4, 3, 1]]),
    denseTemplate("16-mosaic", "拼接", [[0, 0, 2, 2], [2, 0, 2, 2], [4, 0, 2, 2], [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 2, 2], [0, 4, 2, 1], [2, 4, 2, 1]])
  ],
  27: [
    denseTemplate("27-heart-left", "心形左", [[0, 0, 2, 2], [4, 0, 2, 2], [2, 3, 2, 2]]),
    denseTemplate("27-heart-wide", "心形宽", [[0, 0, 2, 2], [4, 0, 2, 2], [0, 4, 2, 2], [5, 5, 1, 1]])
  ],
  28: [
    denseTemplate("28-hero", "大主图", [[0, 0, 3, 3]]),
    denseTemplate("28-center", "中心主图", [[2, 2, 3, 3]])
  ],
  29: [
    denseTemplate("29-hero", "主图加竖栏", [[0, 0, 2, 3], [5, 3, 1, 3]]),
    denseTemplate("29-side", "侧边强调", [[4, 0, 2, 3], [0, 3, 1, 3]])
  ],
  30: [
    denseTemplate("30-duo", "双主图", [[0, 0, 2, 2], [4, 4, 2, 2]]),
    denseTemplate("30-stack", "上下主图", [[0, 0, 2, 2], [0, 4, 2, 2]])
  ],
  31: [
    denseTemplate("31-hero", "一张主图", [[0, 0, 2, 3]]),
    denseTemplate("31-corner", "角落主图", [[4, 3, 2, 3]])
  ]
};

let selectedFiles = [];
let previewUrl = null;
let currentLayout = [];
let dragState = null;
let renderTimer = null;
let exportTimer = null;
const longPressMs = 450;

renderTemplates();

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
    schedulePreviewRender();
  }
});

settingsForm.addEventListener("change", event => {
  if (["mode", "template"].includes(event.target.name)) {
    resetPlacements();
    schedulePreviewRender();
  }
});

window.addEventListener("resize", schedulePreviewRender);

function template(id, name, cells, columns = 6, rows = 6) {
  return { id, name, cells, columns, rows };
}

function denseTemplate(id, name, mergedCells) {
  return template(id, name, denseCells(mergedCells));
}

function denseCells(mergedCells) {
  const covered = new Set();
  const cells = [...mergedCells];

  mergedCells.forEach(cell => {
    for (let row = cell[1]; row < cell[1] + cell[3]; row += 1) {
      for (let column = cell[0]; column < cell[0] + cell[2]; column += 1) {
        covered.add(`${column},${row}`);
      }
    }
  });

  for (let row = 0; row < 6; row += 1) {
    for (let column = 0; column < 6; column += 1) {
      if (!covered.has(`${column},${row}`)) {
        cells.push([column, row, 1, 1]);
      }
    }
  }

  return cells;
}

function addFiles(files) {
  const existingKeys = new Set(selectedFiles.map(item => createFileKey(item.file)));
  const availableSlots = Math.max(0, 31 - selectedFiles.length);
  const additions = [];
  let skippedDuplicates = 0;
  let skippedLimit = 0;

  for (const file of files) {
    const key = createFileKey(file);
    if (existingKeys.has(key)) {
      skippedDuplicates += 1;
      continue;
    }

    existingKeys.add(key);
    if (additions.length < availableSlots) {
      additions.push(createFileItem(file));
    } else {
      skippedLimit += 1;
    }
  }

  if (additions.length === 0) {
    updateSelectionStatus(skippedDuplicates, skippedLimit);
    return;
  }

  selectedFiles = [...selectedFiles, ...additions];
  updateSelectionState(skippedDuplicates, skippedLimit);
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

function updateSelectionState(skippedDuplicates = 0, skippedLimit = 0) {
  renderThumbs();
  renderTemplates();
  resetPreview();
  updateSelectionStatus(skippedDuplicates, skippedLimit);

  if (selectedFiles.length > 0) {
    schedulePreviewRender();
  }
}

function updateSelectionStatus(skippedDuplicates = 0, skippedLimit = 0) {
  statusTitle.textContent = selectedFiles.length ? `已选择 ${selectedFiles.length} 张` : "等待图片";
  if (!selectedFiles.length) {
    statusText.textContent = "选择图片后生成预览";
  } else if (skippedLimit > 0) {
    statusText.textContent = `最多支持 31 张，已忽略 ${skippedLimit} 张`;
  } else if (skippedDuplicates > 0) {
    statusText.textContent = `已跳过 ${skippedDuplicates} 张重复图片`;
  } else {
    statusText.textContent = "可选择模板，或使用自动网格排版";
  }
}

function renderThumbs() {
  thumbStrip.replaceChildren();
  const fragment = document.createDocumentFragment();

  selectedFiles.forEach((item, index) => {
    const thumb = document.createElement("div");
    thumb.className = "thumb-item";

    const image = document.createElement("img");
    image.src = item.previewUrl;
    image.alt = item.file.name;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "thumb-remove";
    removeButton.textContent = "×";
    removeButton.title = "删除图片";
    removeButton.setAttribute("aria-label", `删除 ${item.file.name}`);
    removeButton.addEventListener("click", event => {
      event.stopPropagation();
      removeFile(index);
    });

    thumb.appendChild(image);
    thumb.appendChild(removeButton);
    fragment.appendChild(thumb);
  });

  thumbStrip.appendChild(fragment);
}

function renderTemplates() {
  templateGrid.replaceChildren();
  const templateCount = getTemplateCount();

  if (selectedFiles.length === 0) {
    templateInput.value = "auto";
    templateCountLabel.textContent = "自动";
    updateEqualGridControl();
    const message = document.createElement("p");
    message.className = "template-empty";
    message.textContent = "选择图片后显示对应模板。";
    templateGrid.appendChild(message);
    return;
  }

  const templateItems = templateCount === "auto" ? [] : templates[templateCount] || [];
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
    statusTitle.textContent = "没有图片";
    statusText.textContent = "请先选择至少一张图片";
    return;
  }

  renderTemplates();

  renderEditablePreview();
  await refreshExport();
}

function renderEditablePreview() {
  const settings = getSettings();
  const layout = createLayout(selectedFiles.length, settings);

  emptyState.classList.toggle("is-hidden", selectedFiles.length > 0);
  editableCollage.classList.toggle("has-collage", selectedFiles.length > 0);
  editableCollage.replaceChildren();

  if (selectedFiles.length === 0) {
    return;
  }

  const stage = editableCollage.parentElement;
  const maxWidth = Math.max(280, stage.clientWidth - 36);
  const maxHeight = Math.max(280, stage.clientHeight - 36);
  const scale = Math.min(1, maxWidth / settings.width, maxHeight / settings.height);
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

    tile.appendChild(image);
    tile.addEventListener("pointerdown", event => beginTileDrag(event, index));
    tile.addEventListener("wheel", event => zoomTileImage(event, index));
    editableCollage.appendChild(tile);
  });

  statusTitle.textContent = "可编辑预览";
  statusText.textContent = "滚轮缩放，拖动裁剪，长按后拖动可交换";
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
    statusTitle.textContent = "已置换图片";
    statusText.textContent = `第 ${sourceIndex + 1} 张与第 ${targetIndex + 1} 张已交换`;
  } else if (dragState.moved) {
    statusTitle.textContent = "已移动图片";
    statusText.textContent = "裁剪位置会用于最终下载";
  }

  dragState = null;
  scheduleExportRefresh();
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
  renderThumbs();
}

function enterSwapMode(tile) {
  if (!dragState) {
    return;
  }

  dragState.swapMode = true;
  tile.classList.add("is-swap-source");
  statusTitle.textContent = "交换图片";
  statusText.textContent = "拖到另一格后松开即可交换";
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
  event.preventDefault();
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
  statusTitle.textContent = "已缩放图片";
  statusText.textContent = `当前缩放 ${Math.round(item.scale * 100)}%`;
  scheduleExportRefresh();
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
    scheduleExportRefresh();
  }, 120);
}

function scheduleExportRefresh() {
  clearTimeout(exportTimer);
  exportTimer = setTimeout(refreshExport, 350);
}

async function refreshExport() {
  if (selectedFiles.length === 0) {
    return;
  }

  generateButton.disabled = true;
  generateButton.textContent = "导出中...";
  downloadLink.classList.add("is-disabled");

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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    previewUrl = URL.createObjectURL(blob);
    downloadLink.href = previewUrl;
    downloadLink.classList.remove("is-disabled");
    statusTitle.textContent = "拼图已生成";
    statusText.textContent = "可继续拖动调整，下载会同步更新";
  } catch (error) {
    statusTitle.textContent = "生成失败";
    statusText.textContent = error.message === "Failed to fetch"
      ? "图片数据较大或服务暂时不可用，请稍后重试。"
      : error.message;
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = "生成拼图";
  }
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
  const templateCount = getTemplateCount();
  if (templateCount === "auto") {
    return null;
  }

  return (templates[templateCount] || []).find(item => item.id === templateInput.value);
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

function getTemplateCount() {
  return Array.isArray(templates[selectedFiles.length]) ? selectedFiles.length : "auto";
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
    width: readNumber(formData, "width", 1600),
    height: readNumber(formData, "height", 1200),
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

function resetPlacements() {
  selectedFiles.forEach(item => {
    item.offsetX = 0;
    item.offsetY = 0;
    item.scale = 1;
  });
}

function resetPreview() {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }

  clearTimeout(renderTimer);
  clearTimeout(exportTimer);
  editableCollage.replaceChildren();
  editableCollage.classList.remove("has-collage");
  downloadLink.removeAttribute("href");
  downloadLink.classList.add("is-disabled");
  emptyState.classList.remove("is-hidden");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
