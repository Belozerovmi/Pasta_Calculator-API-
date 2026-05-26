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
const dryPortionResult = document.getElementById("dryPortionResult");
const caloriesResult = document.getElementById("caloriesResult");
const copyBtn = document.getElementById("copyBtn");
const calcBtn = document.getElementById("calcBtn");
const scanBarcodeBtn = document.getElementById("scanBarcodeBtn");
const searchProductBtn = document.getElementById("searchProductBtn");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const searchInput = document.getElementById("searchInput");
const searchResultsDiv = document.getElementById("searchResults");
const scannerContainer = document.getElementById("scannerContainer");
const closeModalBtn = document.getElementById("closeModal");

let html5QrCode = null;
let isModalOpen = false;

// ---- TOAST УВЕДОМЛЕНИЯ ----
function showToast(message, isError = false) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.background = isError ? "#c0392b" : "#1e2d4c";
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// ---- КАСТОМНЫЙ DIALOG ДЛЯ СОЗДАНИЯ ПРОДУКТА (с подписями) ----
function showCustomProductDialog() {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-dialog-overlay";
    overlay.innerHTML = `
      <div class="custom-dialog">
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
          <button class="dialog-cancel">Отмена</button>
          <button class="dialog-confirm">Сохранить</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const confirmBtn = overlay.querySelector(".dialog-confirm");
    const cancelBtn = overlay.querySelector(".dialog-cancel");

    const close = () => overlay.remove();

    confirmBtn.onclick = () => {
      const name = document.getElementById("dialog_name").value.trim();
      const kcal = parseFloat(document.getElementById("dialog_kcal").value);
      const protein = parseFloat(
        document.getElementById("dialog_protein").value
      );
      const fat = parseFloat(document.getElementById("dialog_fat").value);
      const carbs = parseFloat(document.getElementById("dialog_carbs").value);
      close();
      if (!name) {
        showToast("Введите название продукта", true);
        resolve(null);
        return;
      }
      if (isNaN(kcal) || isNaN(protein) || isNaN(fat) || isNaN(carbs)) {
        showToast("Заполните все поля КБЖУ корректными числами", true);
        resolve(null);
        return;
      }
      resolve({ name, kcal, protein, fat, carbs });
    };

    cancelBtn.onclick = () => {
      close();
      resolve(null);
    };
  });
}

// ---- ЗАГРУЗКА ИСТОРИИ ИЗ LOCALSTORAGE ----
function loadHistory() {
  const saved = localStorage.getItem("macrocalc_history");
  if (saved) {
    try {
      productHistory = JSON.parse(saved);
      renderHistory();
    } catch (e) {}
  }
}

// ---- СОХРАНЕНИЕ ИСТОРИИ ----
function saveHistory() {
  localStorage.setItem(
    "macrocalc_history",
    JSON.stringify(productHistory.slice(0, 5))
  );
}

// ---- ДОБАВЛЕНИЕ ПРОДУКТА В ИСТОРИЮ ----
function addToHistory(product) {
  const index = productHistory.findIndex(
    (p) => p.name === product.name && p.kcal === product.kcal
  );
  if (index !== -1) {
    productHistory.splice(index, 1);
  }
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

// ---- ОТРИСОВКА ИСТОРИИ ----
function renderHistory() {
  let historySection = document.querySelector(".history-section");
  const container = document.querySelector(".container");
  const resultCard = document.querySelector(".result-card");

  if (!historySection) {
    historySection = document.createElement("div");
    historySection.className = "history-section";
    const resultCardEl = document.querySelector(".result-card");
    if (resultCardEl) {
      container.insertBefore(historySection, resultCardEl);
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

// ---- ОБНОВЛЕНИЕ UI ПРОДУКТА ----
function updateProductUI() {
  productNameEl.innerText = currentProduct.name;
  kcalVal.innerText = Math.round(currentProduct.kcal);
  proteinVal.innerText = currentProduct.protein.toFixed(1);
  fatVal.innerText = currentProduct.fat.toFixed(1);
  carbsVal.innerText = currentProduct.carbs.toFixed(1);
}

// ---- РАСЧЁТ ----
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
    dryPortionResult.innerText = "Ошибка";
    caloriesResult.innerText = "Заполните все поля (>0)";
    return;
  }
  let dryPortion = (portion * dry) / cooked;
  dryPortion = Math.round(dryPortion * 10) / 10;
  dryPortionResult.innerText = dryPortion + " г";

  let kcalPortion = (currentProduct.kcal * dryPortion) / 100;
  let proteinPortion = (currentProduct.protein * dryPortion) / 100;
  let fatPortion = (currentProduct.fat * dryPortion) / 100;
  let carbsPortion = (currentProduct.carbs * dryPortion) / 100;
  caloriesResult.innerHTML = `${Math.round(
    kcalPortion
  )} ккал  |  ${proteinPortion.toFixed(1)}г бел  |  ${fatPortion.toFixed(
    1
  )}г жир  |  ${carbsPortion.toFixed(1)}г угл`;
}

// ---- КОПИРОВАНИЕ ----
function copyResult() {
  let val = dryPortionResult.innerText;
  if (!val || val === "--" || val === "Ошибка") {
    showToast("Сначала рассчитайте порцию", true);
    return;
  }
  let numeric = val.replace(" г", "");
  navigator.clipboard.writeText(numeric);
  showToast(`Скопировано: ${numeric} г`);
}

// ---- ПОЛУЧЕНИЕ ПРОДУКТА ПО ШТРИХКОДУ ----
async function fetchProductByBarcode(barcode) {
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
  try {
    showToast("Поиск продукта...");
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

// ---- ПОИСК ПРОДУКТА ----
async function searchProduct(query) {
  if (query.length < 2) return;
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    query
  )}&search_simple=1&action=process&json=1&page_size=20`;
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "MacroCalc/2.0" },
    });
    const data = await resp.json();
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
          closeModal();
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
    searchResultsDiv.innerHTML =
      "<div style='padding:16px;color:#858585'>Ошибка поиска</div>";
  }
}

// ---- СОЗДАНИЕ ПРОДУКТА (через кастомный диалог) ----
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

// ---- СКАНЕР (ПЕРЕРАБОТАН) ----
async function startScanner() {
  if (!isModalOpen) return;

  modalTitle.innerText = "Сканирование штрихкода";
  scannerContainer.style.display = "block";
  searchInput.style.display = "none";
  searchResultsDiv.style.display = "none";
  scannerContainer.innerHTML = "";

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
        // Успешное сканирование
        console.log("Отсканирован код:", decodedText);
        try {
          if (html5QrCode) {
            await html5QrCode.stop();
            await html5QrCode.clear();
          }
        } catch (e) {}
        closeModal();
        await fetchProductByBarcode(decodedText);
      },
      (error) => {
        // Ошибки сканирования игнорируем (это нормально, кадры просто не читаются)
        if (error && error.includes("NotFoundException")) return;
      }
    );
  } catch (err) {
    console.error("Ошибка запуска камеры:", err);
    showToast("Не удалось запустить камеру. Проверьте разрешения.", true);
    closeModal();
  }
}

// ---- ОТКРЫТИЕ ПОИСКА ----
function openSearchModal() {
  isModalOpen = true;
  modalTitle.innerText = "Поиск продукта";
  scannerContainer.style.display = "none";
  searchInput.style.display = "block";
  searchResultsDiv.style.display = "block";
  searchInput.value = "";
  searchResultsDiv.innerHTML = "";
  if (html5QrCode) {
    html5QrCode.stop().catch(() => {});
  }
  searchInput.oninput = (e) => searchProduct(e.target.value);
  modal.style.display = "flex";
}

// ---- ОТКРЫТИЕ СКАНЕРА ----
function openScannerModal() {
  isModalOpen = true;
  modalTitle.innerText = "Сканер штрихкода";
  scannerContainer.style.display = "block";
  searchInput.style.display = "none";
  searchResultsDiv.style.display = "none";
  if (html5QrCode) {
    html5QrCode.stop().catch(() => {});
  }
  modal.style.display = "flex";
  // Небольшая задержка для рендеринга модалки
  setTimeout(() => {
    if (modal.style.display === "flex") {
      startScanner();
    }
  }, 300);
}

// ---- ЗАКРЫТИЕ МОДАЛКИ ----
async function closeModal() {
  isModalOpen = false;
  modal.style.display = "none";
  if (html5QrCode) {
    try {
      await html5QrCode.stop();
      await html5QrCode.clear();
    } catch (e) {}
    html5QrCode = null;
  }
  scannerContainer.style.display = "none";
  scannerContainer.innerHTML = "";
}

// ---- ИНИЦИАЛИЗАЦИЯ ----
calcBtn.onclick = calculate;
copyBtn.onclick = copyResult;
scanBarcodeBtn.onclick = openScannerModal;
searchProductBtn.onclick = openSearchModal;
closeModalBtn.onclick = closeModal;
document.getElementById("editProductBtn").onclick = handleCreateProduct;

loadHistory();
updateProductUI();
calculate();
