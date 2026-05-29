// ---- Категории продуктов с предустановками ----
const productPresets = {
  pasta: {
    name: "Макароны ",
    kcal: 354,
    protein: 12.0,
    fat: 1.5,
    carbs: 70.0,
  },
  rice: {
    name: "Рис белый",
    kcal: 330,
    protein: 7.5,
    fat: 0.8,
    carbs: 73.0,
  },
  grains: {
    name: "Крупа",
    kcal: 343,
    protein: 13.3,
    fat: 3.4,
    carbs: 71.5,
  },
};

let currentCategory = "pasta";
let currentProduct = { ...productPresets.pasta, barcode: null };

// ---- История продуктов (максимум 30, показываем по 15) ----
let productHistory = [];
let historyDisplayLimit = 15; // Сколько показываем
let historyTotalLimit = 30; // Максимум храним

// DOM элементы
const productNameEl = document.getElementById("productName");
const kcalVal = document.getElementById("kcalVal");
const proteinVal = document.getElementById("proteinVal");
const fatVal = document.getElementById("fatVal");
const carbsVal = document.getElementById("carbsVal");
const dryTotal = document.getElementById("dryTotal");
const cookedTotal = document.getElementById("cookedTotal");
const portionCooked = document.getElementById("portionCooked");
const calcBtn = document.getElementById("calcBtn");
const scanBarcodeBtn = document.getElementById("scanBarcodeBtn");
const searchProductBtn = document.getElementById("searchProductBtn");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const searchInput = document.getElementById("searchInput");
const searchResultsDiv = document.getElementById("searchResults");
const scannerContainer = document.getElementById("scannerContainer");
const resultModal = document.getElementById("resultModal");
const modalDryPortion = document.getElementById("modalDryPortion");
const modalKbju = document.getElementById("modalKbju");
const modalCopyBtn = document.getElementById("modalCopyBtn");

let html5QrCode = null;
let isModalOpen = false;
let isProcessing = false;

// ---- БЛОКИРОВКА СКРОЛЛА ФОНА ----
function lockBodyScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
  document.body.style.height = "100%";
  document.body.style.overflow = "hidden";
  document.body.dataset.scrollY = scrollY;
}

function unlockBodyScroll() {
  const scrollY = document.body.dataset.scrollY;
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  document.body.style.height = "";
  document.body.style.overflow = "";
  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY));
  }
  delete document.body.dataset.scrollY;
}

// ---- СМЕНА КАТЕГОРИИ (БЕЗ УВЕДОМЛЕНИЙ) ----
function setupCategoryButtons() {
  const buttons = document.querySelectorAll(".category-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.dataset.category;
      if (!category || !productPresets[category]) return;

      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      currentCategory = category;
      currentProduct = { ...productPresets[category], barcode: null };
      updateProductUI();
      updateCookingHint(category);

      if (category === "pasta") {
        dryTotal.value = "100";
        cookedTotal.value = "240";
        portionCooked.value = "200";
      } else if (category === "rice") {
        dryTotal.value = "100";
        cookedTotal.value = "300";
        portionCooked.value = "200";
      } else if (category === "grains") {
        dryTotal.value = "100";
        cookedTotal.value = "250";
        portionCooked.value = "200";
      }
    });
  });
}

// ---- ПОКАЗАТЬ/СКРЫТЬ ИНДИКАТОР ЗАГРУЗКИ ----
function showModalLoading(show, isSearch = true) {
  let existingLoader = document.querySelector(".modal-loader");
  if (show) {
    if (existingLoader) existingLoader.remove();
    const loader = document.createElement("div");
    loader.className = "modal-loader";
    loader.innerHTML = `
      <div class="loader-spinner"></div>
      <div class="loader-text">${isSearch ? "Поиск..." : "Сканирование..."}</div>
    `;
    if (isSearch) {
      searchResultsDiv.innerHTML = "";
      searchResultsDiv.appendChild(loader);
    } else {
      scannerContainer.innerHTML = "";
      scannerContainer.appendChild(loader);
    }
  } else {
    if (existingLoader) existingLoader.remove();
  }
}

function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `<div class="btn-loader"></div> Загрузка...`;
    button.disabled = true;
  } else {
    button.innerHTML = button.dataset.originalText;
    button.disabled = false;
  }
}

// function showToast(message, isError = false) {
//   let toast = document.querySelector(".toast");
//   if (!toast) {
//     toast = document.createElement("div");
//     toast.className = "toast";
//     document.body.appendChild(toast);
//   }
//   toast.textContent = message;
//   toast.style.background = isError ? "#b4656d" : "#2e5a4b";
//   toast.classList.add("show");
//   setTimeout(() => {
//     toast.classList.remove("show");
//   }, 2500);
// }

function closeResultModal() {
  resultModal.style.display = "none";
  unlockBodyScroll();
}

let touchStartY = 0;
resultModal.addEventListener("touchstart", (e) => {
  if (
    e.target === resultModal ||
    e.target.closest(".result-modal-content") === null
  )
    return;
  touchStartY = e.touches[0].clientY;
});
resultModal.addEventListener("touchmove", (e) => {
  const deltaY = e.touches[0].clientY - touchStartY;
  if (deltaY > 50) closeResultModal();
});

function closeMainModal() {
  isProcessing = false;
  isModalOpen = false;

  modal.style.display = "none";
  unlockBodyScroll();

  flashEnabled = false;
  currentCameraTrack = null;
  const flashBtn = document.getElementById("flashToggleBtn");
  if (flashBtn) {
    flashBtn.style.display = "none";
    flashBtn.classList.remove("active");
    flashBtn.disabled = false;
    flashBtn.style.opacity = "1";
    flashBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-bolt"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" /></svg>
      Вспышка
    `;
  }

  if (html5QrCode) {
    try {
      html5QrCode.stop().catch(() => {});
      html5QrCode.clear().catch(() => {});
    } catch (e) {}
    html5QrCode = null;
  }

  scannerContainer.style.display = "none";
  scannerContainer.innerHTML = "";
  searchResultsDiv.innerHTML = "";
  searchInput.value = "";
  searchInput.style.display = "block";
  searchResultsDiv.style.display = "block";

  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.body.style.height = "";
}

function showCustomProductDialog() {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-dialog-overlay";
    overlay.innerHTML = `
      <div class="custom-dialog">
        <button class="custom-dialog-close">✕</button>
        <h4>Создать свой продукт</h4>
        <div class="dialog-field">
          <label>Название продукта</label>
          <input type="text" id="dialog_name" placeholder="например: Макароны Barilla" value="" maxlength="50">
        </div>
        <div class="dialog-field">
          <label>Калорийность (ккал на 100 г)</label>
          <input type="number" id="dialog_kcal" placeholder="350" value="" step="1">
        </div>
        <div class="dialog-field">
          <label>Белки (г на 100 г)</label>
          <input type="number" id="dialog_protein" placeholder="12" value="" step="0.1">
        </div>
        <div class="dialog-field">
          <label>Жиры (г на 100 г)</label>
          <input type="number" id="dialog_fat" placeholder="1.5" value="" step="0.1">
        </div>
        <div class="dialog-field">
          <label>Углеводы (г на 100 г)</label>
          <input type="number" id="dialog_carbs" placeholder="70" value="" step="0.1">
        </div>
        <div class="custom-dialog-buttons">
          <button class="dialog-confirm">Сохранить</button>
          <button class="dialog-cancel">Отмена</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    lockBodyScroll();

    const closeBtn = overlay.querySelector(".custom-dialog-close");
    const confirmBtn = overlay.querySelector(".dialog-confirm");
    const cancelBtn = overlay.querySelector(".dialog-cancel");

    const close = () => {
      overlay.remove();
      unlockBodyScroll();
    };
    const resolveAndClose = (result) => {
      close();
      resolve(result);
    };

    closeBtn.onclick = () => resolveAndClose(null);
    cancelBtn.onclick = () => resolveAndClose(null);
    overlay.onclick = (e) => {
      if (e.target === overlay) resolveAndClose(null);
    };

    confirmBtn.onclick = () => {
      const name = document.getElementById("dialog_name").value.trim();
      const kcal = parseFloat(document.getElementById("dialog_kcal").value);
      const protein = parseFloat(
        document.getElementById("dialog_protein").value,
      );
      const fat = parseFloat(document.getElementById("dialog_fat").value);
      const carbs = parseFloat(document.getElementById("dialog_carbs").value);
      if (!name) {
        showToast("Введите название продукта", true);
        return;
      }
      if (isNaN(kcal) || isNaN(protein) || isNaN(fat) || isNaN(carbs)) {
        showToast("Заполните все поля КБЖУ корректными числами", true);
        return;
      }
      resolveAndClose({ name, kcal, protein, fat, carbs });
    };
  });
}

function loadHistory() {
  const saved = localStorage.getItem("macrocalc_history");
  if (saved) {
    try {
      productHistory = JSON.parse(saved);
      // Ограничиваем длину истории при загрузке
      if (productHistory.length > historyTotalLimit) {
        productHistory = productHistory.slice(0, historyTotalLimit);
      }
      renderHistory();
    } catch (e) {}
  }
}

function saveHistory() {
  // Сохраняем только последние historyTotalLimit записей
  const toSave = productHistory.slice(0, historyTotalLimit);
  localStorage.setItem("macrocalc_history", JSON.stringify(toSave));
}

function addToHistory(product) {
  const index = productHistory.findIndex(
    (p) => p.name === product.name && p.kcal === product.kcal,
  );
  if (index !== -1) productHistory.splice(index, 1);
  productHistory.unshift({
    name: product.name,
    kcal: product.kcal,
    protein: product.protein,
    fat: product.fat,
    carbs: product.carbs,
    barcode: product.barcode,
  });
  // Ограничиваем длину
  if (productHistory.length > historyTotalLimit) {
    productHistory = productHistory.slice(0, historyTotalLimit);
  }
  saveHistory();
  renderHistory();
}

function deleteFromHistory(index, event) {
  event.stopPropagation();
  productHistory.splice(index, 1);
  saveHistory();
  renderHistory();
  showToast("Продукт удалён из истории");
}

function loadMoreHistory() {
  historyDisplayLimit += 15;
  if (historyDisplayLimit > productHistory.length) {
    historyDisplayLimit = productHistory.length;
  }
  renderHistory();
}

// ---- ПОЛУЧЕНИЕ ИКОНКИ ДЛЯ КАТЕГОРИИ ----
function getCategoryIcon(productName) {
  const name = productName.toLowerCase();
  if (
    name.includes("макарон") ||
    name.includes("паста") ||
    name.includes("спагетти")
  ) {
    return '<i class="fas fa-utensils" style="font-size: 18px; color: #1e2d4c;"></i>';
  }
  if (name.includes("рис")) {
    return '<i class="fas fa-bowl-rice" style="font-size: 18px; color: #1e2d4c;"></i>';
  }
  if (
    name.includes("гречк") ||
    name.includes("перлов") ||
    name.includes("овсян") ||
    name.includes("булгур") ||
    name.includes("крупа")
  ) {
    return '<i class="fas fa-seedling" style="font-size: 18px; color: #1e2d4c;"></i>';
  }
  return '<i class="fas fa-utensil-spoon" style="font-size: 18px; color: #1e2d4c;"></i>';
}

function renderHistory() {
  let historySection = document.querySelector(".history-section");
  const container = document.querySelector(".container");

  if (!historySection) {
    historySection = document.createElement("div");
    historySection.className = "history-section";
    const actionRow = document.querySelector(".action-row");
    if (actionRow) {
      actionRow.insertAdjacentElement("afterend", historySection);
    } else {
      container.appendChild(historySection);
    }
  }

  const displayItems = productHistory.slice(0, historyDisplayLimit);
  const hasMore = productHistory.length > historyDisplayLimit;

  if (productHistory.length === 0) {
    historySection.innerHTML = `
      <div class="history-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8l0 4l2 2" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" /></svg>
        <span>Недавние продукты</span>
      </div>
      <div class="history-empty">Здесь будут появляться макароны, крупы и рис, которые вы искали</div>
    `;
    return;
  }

  historySection.innerHTML = `
    <div class="history-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8l0 4l2 2" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" /></svg>
      <span>Недавние продукты (${productHistory.length})</span>
      <button class="history-clear" id="clearHistoryBtn">Очистить всё</button>
    </div>
    <div class="history-list">
      ${displayItems
        .map(
          (p, idx) => `
        <div class="history-item" data-index="${idx}">
          <div class="history-item-icon">
            ${getCategoryIcon(p.name)}
          </div>
          <div class="history-item-info">
            <div class="history-item-name">${p.name.length > 18 ? p.name.slice(0, 16) + "..." : p.name}</div>
            <div class="history-item-kcal">${Math.round(p.kcal)} ккал / 100г</div>
          </div>
          <button class="history-delete-btn" data-index="${idx}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      `,
        )
        .join("")}
    </div>
    ${hasMore ? `<button class="history-load-more" id="loadMoreHistoryBtn">Показать ещё (${productHistory.length - historyDisplayLimit} осталось)</button>` : ""}
  `;

  // Клик по продукту — только подставляем в карточку, НЕ открываем модалку
  document.querySelectorAll(".history-item").forEach((item) => {
    const idx = parseInt(item.dataset.index);
    const product = productHistory[idx];
    if (!product) return;

    item.addEventListener("click", (e) => {
      if (e.target.closest(".history-delete-btn")) return;
      currentProduct = {
        name: product.name,
        kcal: product.kcal,
        protein: product.protein,
        fat: product.fat,
        carbs: product.carbs,
        barcode: product.barcode || null,
      };
      updateProductUI();
      showToast(`Выбран: ${currentProduct.name}`);
    });
  });

  // Кнопки удаления
  document.querySelectorAll(".history-delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      deleteFromHistory(idx, e);
    });
  });

  const clearBtn = document.getElementById("clearHistoryBtn");
  if (clearBtn) {
    clearBtn.onclick = () => {
      productHistory = [];
      historyDisplayLimit = 15;
      saveHistory();
      renderHistory();
      showToast("Вся история очищена");
    };
  }

  const loadMoreBtn = document.getElementById("loadMoreHistoryBtn");
  if (loadMoreBtn) {
    loadMoreBtn.onclick = () => loadMoreHistory();
  }
}

function updateProductUI() {
  productNameEl.innerText = truncateProductName(currentProduct.name, 32);
  productNameEl.title = currentProduct.name;
  kcalVal.innerText = Math.round(currentProduct.kcal);
  proteinVal.innerText = currentProduct.protein.toFixed(1);
  fatVal.innerText = currentProduct.fat.toFixed(1);
  carbsVal.innerText = currentProduct.carbs.toFixed(1);
}

function calculate() {
  let dry = parseFloat(dryTotal.value);
  let cooked = parseFloat(cookedTotal.value);
  let portion = parseFloat(portionCooked.value);
  if (
    isNaN(dry) ||
    isNaN(cooked) ||
    isNaN(portion) ||
    dry <= 0 ||
    cooked <= 0 ||
    portion <= 0
  ) {
    showToast("Заполните все поля (>0)", true);
    return;
  }
  let dryPortion = (portion * dry) / cooked;
  dryPortion = Math.round(dryPortion * 10) / 10;

  let kcalPortion = (currentProduct.kcal * dryPortion) / 100;
  let proteinPortion = (currentProduct.protein * dryPortion) / 100;
  let fatPortion = (currentProduct.fat * dryPortion) / 100;
  let carbsPortion = (currentProduct.carbs * dryPortion) / 100;

  modalDryPortion.innerText = dryPortion;
  modalKbju.innerHTML = `${Math.round(kcalPortion)} ккал &nbsp;|&nbsp; ${proteinPortion.toFixed(1)}г бел &nbsp;|&nbsp; ${fatPortion.toFixed(1)}г жир &nbsp;|&nbsp; ${carbsPortion.toFixed(1)}г угл`;

  resultModal.style.display = "flex";
  lockBodyScroll();
}

function copyResultFromModal() {
  let val = modalDryPortion.innerText;
  if (!val || val === "--") {
    showToast("Ошибка", true);
    return;
  }
  navigator.clipboard.writeText(val);
  showToast(`Скопировано: ${val} г`);
  closeResultModal();
}

async function fetchProductByBarcode(barcode) {
  const url = `https://ru.openfoodfacts.org/api/v0/product/${barcode}.json`;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "MacroCalc/2.0 (support@macrocalc.ru)" },
    });
    const data = await response.json();
    if (data.status === 1 && data.product) {
      const p = data.product;
      const nut = p.nutriments;
      let kcal = nut["energy-kcal_100g"] || nut["energy_100g"] || 350;
      let protein = nut["proteins_100g"] || 0;
      let fat = nut["fat_100g"] || 0;
      let carbs = nut["carbohydrates_100g"] || 0;
      currentProduct = {
        name: p.product_name || p.brands || "Продукт",
        kcal: kcal,
        protein: protein,
        fat: fat,
        carbs: carbs,
        barcode: barcode,
      };
      updateProductUI();
      addToHistory(currentProduct);
      showToast(`Найден: ${currentProduct.name}`);
      return true;
    } else {
      showToast(`Штрихкод ${barcode} не найден в базе`, true);
      return false;
    }
  } catch (e) {
    console.error("Ошибка API:", e);
    showToast("Ошибка соединения с сервером", true);
    return false;
  }
}

// ---- ПОИСК ПРОДУКТА ----
// ---- ПОИСК ПРОДУКТА (РАБОЧАЯ ВЕРСИЯ) ----
let searchTimeout = null;
let isSearching = false;

async function searchProduct(query) {
  // Очищаем предыдущий таймаут
  if (searchTimeout) clearTimeout(searchTimeout);

  // Если запрос слишком короткий — очищаем результаты и выходим
  if (!query || query.trim().length < 2) {
    searchResultsDiv.innerHTML = "";
    return;
  }

  // Делаем debounce — ждём 500ms после последнего ввода
  searchTimeout = setTimeout(async () => {
    // Предотвращаем повторные одновременные запросы
    if (isSearching) return;
    isSearching = true;

    // Показываем индикатор загрузки
    showModalLoading(true, true);

    // Используем проверенный API V1 (работает стабильно)
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;

    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent": "MacroCalc/2.0 (Mozilla/5.0)",
        },
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const data = await resp.json();

      // Убираем индикатор загрузки
      showModalLoading(false, true);
      searchResultsDiv.innerHTML = "";

      // Проверяем, есть ли продукты
      if (data.products && data.products.length > 0) {
        // Фильтруем только продукты с КБЖУ
        const validProducts = data.products.filter((prod) => prod.nutriments);

        if (validProducts.length === 0) {
          searchResultsDiv.innerHTML =
            "<div style='padding:16px;color:#858585;text-align:center'>Нет продуктов с полными данными КБЖУ</div>";
        } else {
          validProducts.forEach((prod) => {
            const nut = prod.nutriments;
            const div = document.createElement("div");
            div.className = "search-item";

            // Приводим название к нормальному виду
            let productName =
              prod.product_name || prod.brands || "Без названия";
            if (productName !== "Без названия" && productName.length > 0) {
              productName =
                productName.charAt(0).toUpperCase() + productName.slice(1);
            }

            div.innerHTML = `<strong>${productName}</strong><br>
              <span style="font-size:13px;color:#858585">
                ${nut["energy-kcal_100g"] || nut["energy_100g"] || "?"} ккал · 
                белки ${nut["proteins_100g"] || "?"}г · 
                жиры ${nut["fat_100g"] || "?"}г · 
                углеводы ${nut["carbohydrates_100g"] || "?"}г
              </span>`;

            div.onclick = () => {
              currentProduct = {
                name: productName,
                kcal: nut["energy-kcal_100g"] || nut["energy_100g"] || 350,
                protein: nut["proteins_100g"] || 10,
                fat: nut["fat_100g"] || 1,
                carbs: nut["carbohydrates_100g"] || 70,
                barcode: prod.code,
              };
              updateProductUI();
              addToHistory(currentProduct);
              closeMainModal();
              showToast(`Выбран: ${currentProduct.name}`);
            };
            searchResultsDiv.appendChild(div);
          });
        }
      } else {
        searchResultsDiv.innerHTML =
          "<div style='padding:16px;color:#858585;text-align:center'>Ничего не найдено. Попробуйте другое название или создайте свой продукт.</div>";
      }
    } catch (err) {
      console.error("Ошибка поиска:", err);
      showModalLoading(false, true);
      searchResultsDiv.innerHTML =
        "<div style='padding:16px;color:#b4656d;text-align:center'>Ошибка соединения. Проверьте интернет и попробуйте снова.</div>";
    } finally {
      isSearching = false;
    }
  }, 500);
}

async function handleCreateProduct() {
  const result = await showCustomProductDialog();
  if (result) {
    currentProduct = {
      name: result.name,
      kcal: result.kcal,
      protein: result.protein,
      fat: result.fat,
      carbs: result.carbs,
      barcode: null,
    };
    updateProductUI();
    addToHistory(currentProduct);
    showToast(`Создан: ${currentProduct.name}`);
  }
}

let currentCameraTrack = null;
let flashEnabled = false;

async function startScanner() {
  if (!isModalOpen || isProcessing) return;

  isProcessing = true;
  modalTitle.innerText = "Сканирование штрихкода";
  scannerContainer.style.display = "block";
  searchInput.style.display = "none";
  searchResultsDiv.style.display = "none";
  scannerContainer.innerHTML = "";
  showModalLoading(true, false);

  const flashBtn = document.getElementById("flashToggleBtn");
  if (flashBtn) flashBtn.style.display = "none";

  if (html5QrCode) {
    try {
      await html5QrCode.stop();
      await html5QrCode.clear();
    } catch (e) {}
    html5QrCode = null;
  }

  html5QrCode = new Html5Qrcode("scannerContainer");

  const config = {
    fps: 15,
    qrbox: { width: 280, height: 200 },
    aspectRatio: 1.333,
  };

  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      config,
      async (decodedText) => {
        if (html5QrCode) {
          try {
            await html5QrCode.stop();
            await html5QrCode.clear();
          } catch (e) {}
          html5QrCode = null;
        }

        showModalLoading(true, false);
        await fetchProductByBarcode(decodedText);
        showModalLoading(false, false);

        isProcessing = false;
        isModalOpen = false;
        modal.style.display = "none";
        unlockBodyScroll();

        scannerContainer.style.display = "none";
        scannerContainer.innerHTML = "";
        searchResultsDiv.innerHTML = "";
        searchInput.value = "";
        searchInput.style.display = "block";
        searchResultsDiv.style.display = "block";

        flashEnabled = false;
        currentCameraTrack = null;
        if (flashBtn) {
          flashBtn.style.display = "none";
          flashBtn.classList.remove("active");
        }
      },
      (error) => {
        if (error && error.includes("NotFoundException")) return;
        console.warn("Ошибка сканирования:", error);
      },
    );

    showModalLoading(false, false);

    if (flashBtn) flashBtn.style.display = "flex";

    try {
      const videoElement = document.querySelector("#scannerContainer video");
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject;
        const track = stream.getVideoTracks()[0];
        currentCameraTrack = track;

        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
          flashBtn.disabled = false;
        } else {
          flashBtn.disabled = true;
          flashBtn.style.opacity = "0.5";
          flashBtn.title = "Вспышка не поддерживается на этом устройстве";
        }
      }
    } catch (e) {
      console.warn("Не удалось получить доступ к управлению вспышкой:", e);
      if (flashBtn) flashBtn.disabled = true;
    }
  } catch (err) {
    console.error("Ошибка запуска камеры:", err);
    showModalLoading(false, false);
    showToast("Не удалось запустить камеру. Проверьте разрешения.", true);
    isProcessing = false;
    isModalOpen = false;
    modal.style.display = "none";
    unlockBodyScroll();
    scannerContainer.style.display = "none";
    scannerContainer.innerHTML = "";
  }
}

function setupFlashButton() {
  const flashBtn = document.getElementById("flashToggleBtn");
  if (!flashBtn) return;

  flashBtn.addEventListener("click", async () => {
    if (!currentCameraTrack) return;

    try {
      flashEnabled = !flashEnabled;
      await currentCameraTrack.applyConstraints({
        advanced: [{ torch: flashEnabled }],
      });

      if (flashEnabled) {
        flashBtn.classList.add("active");
        flashBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-bolt"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" /></svg>
          Вспышка вкл
        `;
      } else {
        flashBtn.classList.remove("active");
        flashBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-bolt"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" /></svg>
          Вспышка
        `;
      }
    } catch (err) {
      console.error("Ошибка переключения вспышки:", err);
      showToast("Не удалось переключить вспышку", true);
    }
  });
}

function pushModalState() {
  history.pushState({ modalOpen: true }, "");
}

function openSearchModal() {
  if (isProcessing) return;

  isProcessing = false;
  isModalOpen = true;

  modalTitle.innerText = "Поиск продукта";
  scannerContainer.style.display = "none";
  searchInput.style.display = "block";
  searchResultsDiv.style.display = "block";
  searchInput.value = "";
  searchResultsDiv.innerHTML = "";

  if (html5QrCode) {
    html5QrCode.stop().catch(() => {});
    html5QrCode = null;
  }

  flashEnabled = false;
  currentCameraTrack = null;
  const flashBtn = document.getElementById("flashToggleBtn");
  if (flashBtn) {
    flashBtn.style.display = "none";
    flashBtn.classList.remove("active");
  }

  searchInput.oninput = (e) => searchProduct(e.target.value);
  modal.style.display = "flex";
  lockBodyScroll();
  pushModalState();
}

function openScannerModal() {
  if (isProcessing) return;

  isProcessing = false;
  isModalOpen = true;
  flashEnabled = false;
  currentCameraTrack = null;

  modalTitle.innerText = "Сканирование штрихкода";
  scannerContainer.style.display = "block";
  searchInput.style.display = "none";
  searchResultsDiv.style.display = "none";
  scannerContainer.innerHTML = "";

  if (html5QrCode) {
    html5QrCode.stop().catch(() => {});
    html5QrCode = null;
  }

  const flashBtn = document.getElementById("flashToggleBtn");
  if (flashBtn) {
    flashBtn.style.display = "none";
    flashBtn.classList.remove("active");
    flashBtn.disabled = false;
  }

  modal.style.display = "flex";
  lockBodyScroll();
  pushModalState();

  setTimeout(() => {
    if (modal.style.display === "flex") {
      startScanner();
    }
  }, 300);
}

window.addEventListener("popstate", () => {
  if (modal.style.display === "flex") {
    closeMainModal();
  }
  if (resultModal.style.display === "flex") {
    closeResultModal();
  }
});

// ---- ИНИЦИАЛИЗАЦИЯ ----
calcBtn.onclick = calculate;
scanBarcodeBtn.onclick = openScannerModal;
searchProductBtn.onclick = openSearchModal;
document.getElementById("editProductBtn").onclick = handleCreateProduct;

modalCopyBtn.onclick = copyResultFromModal;

document.getElementById("resultModalCloseX").onclick = closeResultModal;
document.getElementById("mainModalCloseX").onclick = closeMainModal;

resultModal.onclick = (e) => {
  if (e.target === resultModal) closeResultModal();
};
modal.onclick = (e) => {
  if (e.target === modal && !isProcessing) closeMainModal();
};

const cookingRatios = {
  pasta: { dry: 100, cooked: 240, text: "100 г сухих макарон ≈ 240 г варёных" },
  rice: { dry: 100, cooked: 300, text: "100 г сухого риса ≈ 300 г варёного" },
  grains: { dry: 100, cooked: 250, text: "100 г сухой крупы ≈ 250 г варёной" },
};

function updateCookingHint(category) {
  const hintSpan = document.getElementById("hintText");
  if (hintSpan && cookingRatios[category]) {
    hintSpan.textContent = cookingRatios[category].text;
  }
}

function updateSliderPosition() {
  const activeBtn = document.querySelector(".category-btn.active");
  const slider = document.getElementById("sliderIndicator");
  const selector = document.getElementById("categorySelector");

  if (!activeBtn || !slider || !selector) return;

  const btnRect = activeBtn.getBoundingClientRect();
  const selectorRect = selector.getBoundingClientRect();

  const left = btnRect.left - selectorRect.left;
  const width = btnRect.width;

  slider.style.left = `${left}px`;
  slider.style.width = `${width}px`;
}

function setupCategoryButtonsWithSlider() {
  const buttons = document.querySelectorAll(".category-btn");

  setTimeout(() => updateSliderPosition(), 10);
  window.addEventListener("resize", () => updateSliderPosition());

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.dataset.category;
      if (!category || !productPresets[category]) return;

      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updateSliderPosition();

      currentCategory = category;
      currentProduct = { ...productPresets[category], barcode: null };
      updateProductUI();
      updateCookingHint(category);

      const defaults = {
        pasta: { dry: 100, cooked: 240, portion: 200 },
        rice: { dry: 100, cooked: 300, portion: 200 },
        grains: { dry: 100, cooked: 250, portion: 200 },
      };

      const def = defaults[category] || defaults.pasta;
      dryTotal.value = def.dry;
      cookedTotal.value = def.cooked;
      portionCooked.value = def.portion;
    });
  });
}

function truncateProductName(name, maxLength = 35) {
  if (!name) return "Продукт";
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength) + "...";
}

setupFlashButton();
setupCategoryButtonsWithSlider();
loadHistory();
updateProductUI();
