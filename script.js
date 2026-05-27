// ---- Текущий продукт ----
let currentProduct = {
  name: "Макароны (твёрдые сорта)",
  kcal: 354,
  protein: 12,
  fat: 1.5,
  carbs: 70,
  barcode: null,
};

// ---- История продуктов (максимум 5) ----
let productHistory = [];

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
let isProcessing = false; // для блокировки повторных действий

// ---- ПОКАЗАТЬ/СКРЫТЬ ИНДИКАТОР ЗАГРУЗКИ В МОДАЛКЕ ----
function showModalLoading(show, isSearch = true) {
  let existingLoader = document.querySelector(".modal-loader");
  if (show) {
    if (existingLoader) existingLoader.remove();
    const loader = document.createElement("div");
    loader.className = "modal-loader";
    loader.innerHTML = `
      <div class="loader-spinner"></div>
      <div class="loader-text">${
        isSearch ? "Поиск..." : "Сканирование..."
      }</div>
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

// ---- ПОКАЗАТЬ ИНДИКАТОР НА ГЛАВНОЙ КНОПКЕ ----
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

// ---- TOAST УВЕДОМЛЕНИЯ ----
function showToast(message, isError = false) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.background = isError ? "#b4656d" : "#2e5a4b";
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// ---- ЗАКРЫТИЕ МОДАЛКИ РЕЗУЛЬТАТА ----
function closeResultModal() {
  resultModal.style.display = "none";
}

// Свайп вниз для закрытия модалки результата
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

// ---- ЗАКРЫТИЕ ОСНОВНОЙ МОДАЛКИ ----
function closeMainModal() {
  if (isProcessing) return;
  isModalOpen = false;
  modal.style.display = "none";
  if (html5QrCode) {
    html5QrCode.stop().catch(() => {});
    html5QrCode = null;
  }
  scannerContainer.style.display = "none";
  scannerContainer.innerHTML = "";
  searchResultsDiv.innerHTML = "";
  searchInput.value = "";
}

// ---- КАСТОМНЫЙ DIALOG ДЛЯ СОЗДАНИЯ ПРОДУКТА ----
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
          <input type="text" id="dialog_name" placeholder="например: Макароны Barilla" value="Мои макароны">
        </div>
        <div class="dialog-field">
          <label>Калорийность (ккал на 100 г)</label>
          <input type="number" id="dialog_kcal" placeholder="350" value="350" step="1">
        </div>
        <div class="dialog-field">
          <label>Белки (г на 100 г)</label>
          <input type="number" id="dialog_protein" placeholder="12" value="12" step="0.1">
        </div>
        <div class="dialog-field">
          <label>Жиры (г на 100 г)</label>
          <input type="number" id="dialog_fat" placeholder="1.5" value="1.5" step="0.1">
        </div>
        <div class="dialog-field">
          <label>Углеводы (г на 100 г)</label>
          <input type="number" id="dialog_carbs" placeholder="70" value="70" step="0.1">
        </div>
        <div class="custom-dialog-buttons">
          <button class="dialog-confirm">Сохранить</button>
          <button class="dialog-cancel">Отмена</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector(".custom-dialog-close");
    const confirmBtn = overlay.querySelector(".dialog-confirm");
    const cancelBtn = overlay.querySelector(".dialog-cancel");

    const close = () => overlay.remove();

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
        document.getElementById("dialog_protein").value
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

// ---- ЗАГРУЗКА ИСТОРИИ ----
function loadHistory() {
  const saved = localStorage.getItem("macrocalc_history");
  if (saved) {
    try {
      productHistory = JSON.parse(saved);
      renderHistory();
    } catch (e) {}
  }
}

function saveHistory() {
  localStorage.setItem(
    "macrocalc_history",
    JSON.stringify(productHistory.slice(0, 5))
  );
}

function addToHistory(product) {
  const index = productHistory.findIndex(
    (p) => p.name === product.name && p.kcal === product.kcal
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
  if (productHistory.length > 5) productHistory.pop();
  saveHistory();
  renderHistory();
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

  if (productHistory.length === 0) {
    historySection.innerHTML = `
      <div class="history-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8l0 4l2 2" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" /></svg>
        <span>Недавние продукты</span>
      </div>
      <div class="history-empty">Здесь будут появляться макароны, которые вы искали</div>
    `;
    return;
  }

  historySection.innerHTML = `
    <div class="history-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8l0 4l2 2" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" /></svg>
      <span>Недавние продукты</span>
      <button class="history-clear" id="clearHistoryBtn">Очистить</button>
    </div>
    <div class="history-list">
      ${productHistory
        .map(
          (p) => `
        <div class="history-item" data-name="${p.name.replace(
          /"/g,
          "&quot;"
        )}" data-kcal="${p.kcal}" data-protein="${p.protein}" data-fat="${
            p.fat
          }" data-carbs="${p.carbs}" data-barcode="${p.barcode || ""}">
          <div class="history-item-name">${
            p.name.length > 20 ? p.name.slice(0, 18) + "..." : p.name
          }</div>
          <div class="history-item-kcal">${Math.round(p.kcal)} ккал / 100г</div>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  document.querySelectorAll(".history-item").forEach((item) => {
    item.addEventListener("click", () => {
      currentProduct = {
        name: item.dataset.name,
        kcal: parseFloat(item.dataset.kcal),
        protein: parseFloat(item.dataset.protein),
        fat: parseFloat(item.dataset.fat),
        carbs: parseFloat(item.dataset.carbs),
        barcode: item.dataset.barcode || null,
      };
      updateProductUI();
      calculate();
      showToast(`Выбран: ${currentProduct.name}`);
    });
  });

  const clearBtn = document.getElementById("clearHistoryBtn");
  if (clearBtn) {
    clearBtn.onclick = () => {
      productHistory = [];
      saveHistory();
      renderHistory();
      showToast("История очищена");
    };
  }
}

function updateProductUI() {
  productNameEl.innerText = currentProduct.name;
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
  modalKbju.innerHTML = `${Math.round(
    kcalPortion
  )} ккал &nbsp;|&nbsp; ${proteinPortion.toFixed(
    1
  )}г бел &nbsp;|&nbsp; ${fatPortion.toFixed(
    1
  )}г жир &nbsp;|&nbsp; ${carbsPortion.toFixed(1)}г угл`;

  resultModal.style.display = "flex";
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

// ---- ПОЛУЧЕНИЕ ПРОДУКТА ПО ШТРИХКОДУ (С ИНДИКАТОРОМ) ----
async function fetchProductByBarcode(barcode) {
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
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
        name: p.product_name || p.brands || "Макароны",
        kcal: kcal,
        protein: protein,
        fat: fat,
        carbs: carbs,
        barcode: barcode,
      };
      updateProductUI();
      calculate();
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

// ---- ПОИСК ПРОДУКТА (С ИНДИКАТОРОМ) ----
async function searchProduct(query) {
  if (query.length < 2) return;
  showModalLoading(true, true);
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    query
  )}&search_simple=1&action=process&json=1&page_size=20`;
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "MacroCalc/2.0" },
    });
    const data = await resp.json();
    showModalLoading(false, true);
    searchResultsDiv.innerHTML = "";
    if (data.products && data.products.length) {
      data.products.forEach((prod) => {
        const nut = prod.nutriments;
        if (!nut) return;
        const div = document.createElement("div");
        div.className = "search-item";
        div.innerHTML = `<strong>${
          prod.product_name || "Без названия"
        }</strong><br><span style="font-size:13px;color:#858585">${
          nut["energy-kcal_100g"] || "?"
        } ккал · белки ${nut["proteins_100g"] || "?"}г</span>`;
        div.onclick = () => {
          currentProduct = {
            name: prod.product_name || "Найденный продукт",
            kcal: nut["energy-kcal_100g"] || 350,
            protein: nut["proteins_100g"] || 10,
            fat: nut["fat_100g"] || 1,
            carbs: nut["carbohydrates_100g"] || 70,
            barcode: prod.code,
          };
          updateProductUI();
          calculate();
          addToHistory(currentProduct);
          closeMainModal();
          showToast(`Выбран: ${currentProduct.name}`);
        };
        searchResultsDiv.appendChild(div);
      });
    } else {
      searchResultsDiv.innerHTML =
        "<div style='padding:16px;color:#858585;text-align:center'>Ничего не найдено. Создайте свой продукт.</div>";
    }
  } catch (err) {
    console.error("Ошибка поиска:", err);
    showModalLoading(false, true);
    searchResultsDiv.innerHTML =
      "<div style='padding:16px;color:#858585'>Ошибка поиска</div>";
  }
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
    calculate();
    addToHistory(currentProduct);
    showToast(`Создан: ${currentProduct.name}`);
  }
}

// ---- СКАНЕР (ПОЛНОСТЬЮ ПЕРЕРАБОТАН) ----
async function startScanner() {
  if (!isModalOpen || isProcessing) return;

  isProcessing = true;
  modalTitle.innerText = "Сканирование штрихкода";
  scannerContainer.style.display = "block";
  searchInput.style.display = "none";
  searchResultsDiv.style.display = "none";
  scannerContainer.innerHTML = "";
  showModalLoading(true, false);

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
        // Сразу отключаем сканер, чтобы не было повторных срабатываний
        if (html5QrCode) {
          try {
            await html5QrCode.stop();
            await html5QrCode.clear();
          } catch (e) {}
          html5QrCode = null;
        }

        // Показываем индикатор загрузки вместо видео
        showModalLoading(true, false);

        // Закрываем модалку ТОЛЬКО после успешного ответа от API
        const success = await fetchProductByBarcode(decodedText);

        // Убираем индикатор и закрываем
        showModalLoading(false, false);
        closeMainModal();
        isProcessing = false;
      },
      (error) => {
        // Игнорируем ошибки NotFound (кадры без кода)
        if (error && error.includes("NotFoundException")) return;
        console.warn("Ошибка сканирования:", error);
      }
    );
    // Убираем индикатор загрузки после успешного старта камеры
    showModalLoading(false, false);
  } catch (err) {
    console.error("Ошибка запуска камеры:", err);
    showModalLoading(false, false);
    showToast("Не удалось запустить камеру. Проверьте разрешения.", true);
    closeMainModal();
    isProcessing = false;
  }
}

function openSearchModal() {
  if (isProcessing) return;
  isModalOpen = true;
  isProcessing = false;
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
  searchInput.oninput = (e) => searchProduct(e.target.value);
  modal.style.display = "flex";
}

function openScannerModal() {
  if (isProcessing) return;
  isModalOpen = true;
  isProcessing = false;
  modalTitle.innerText = "Сканер штрихкода";
  scannerContainer.style.display = "block";
  searchInput.style.display = "none";
  searchResultsDiv.style.display = "none";
  if (html5QrCode) {
    html5QrCode.stop().catch(() => {});
    html5QrCode = null;
  }
  modal.style.display = "flex";
  setTimeout(() => {
    if (modal.style.display === "flex") {
      startScanner();
    }
  }, 300);
}

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

loadHistory();
updateProductUI();
