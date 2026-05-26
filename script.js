// ---- Текущий продукт ----
let currentProduct = {
  name: "Макароны (твёрдые сорта)",
  kcal: 354,
  protein: 12,
  fat: 1.5,
  carbs: 70,
  barcode: null,
};

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

function copyResult() {
  let val = dryPortionResult.innerText;
  if (!val || val === "--" || val === "Ошибка") return;
  let numeric = val.replace(" г", "");
  navigator.clipboard.writeText(numeric);
  alert(`Скопировано: ${numeric} г`);
}

async function fetchProductByBarcode(barcode) {
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "MacroCalc/2.0 (support@macrocalc.ru)" },
    });
    const data = await response.json();
    if (data.status === 1) {
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
      return true;
    } else {
      alert("Штрихкод не найден в базе.");
      return false;
    }
  } catch (e) {
    alert("Ошибка соединения с Open Food Facts");
    return false;
  }
}

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
          closeModal();
        };
        searchResultsDiv.appendChild(div);
      });
    } else {
      searchResultsDiv.innerHTML =
        "<div style='padding:16px;color:#858585;text-align:center'>Ничего не найдено. Создайте свой продукт.</div>";
    }
  } catch (err) {
    searchResultsDiv.innerHTML =
      "<div style='padding:16px;color:#858585'>Ошибка поиска</div>";
  }
}

function showCustomProductDialog() {
  let name = prompt("Название продукта:", "Мои макароны");
  if (!name) return;
  let kcal = parseFloat(prompt("Калорийность на 100 г (сухие):", "350"));
  let prot = parseFloat(prompt("Белки на 100 г:", "12"));
  let fat = parseFloat(prompt("Жиры на 100 г:", "1.5"));
  let carbs = parseFloat(prompt("Углеводы на 100 г:", "70"));
  if (!isNaN(kcal) && !isNaN(prot) && !isNaN(fat) && !isNaN(carbs)) {
    currentProduct = {
      name,
      kcal,
      protein: prot,
      fat,
      carbs,
      barcode: null,
    };
    updateProductUI();
    calculate();
  } else alert("Введите корректные числа.");
}

function startScanner() {
  modalTitle.innerText = "Сканирование штрихкода";
  scannerContainer.style.display = "block";
  searchInput.style.display = "none";
  searchResultsDiv.style.display = "none";
  if (html5QrCode) {
    html5QrCode.stop().catch(() => {});
  }
  html5QrCode = new Html5Qrcode("scannerContainer");
  const config = { fps: 10, qrbox: { width: 250, height: 150 } };
  html5QrCode.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      html5QrCode.stop();
      fetchProductByBarcode(decodedText).then(() => closeModal());
    },
    (err) => {}
  );
}

function openSearchModal() {
  modalTitle.innerText = "Поиск продукта";
  scannerContainer.style.display = "none";
  searchInput.style.display = "block";
  searchResultsDiv.style.display = "block";
  searchInput.value = "";
  searchResultsDiv.innerHTML = "";
  searchInput.oninput = (e) => searchProduct(e.target.value);
  modal.style.display = "flex";
}

function openScannerModal() {
  modalTitle.innerText = "Сканер";
  scannerContainer.style.display = "block";
  searchInput.style.display = "none";
  searchResultsDiv.style.display = "none";
  startScanner();
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
  if (html5QrCode) html5QrCode.stop().catch(() => {});
  scannerContainer.style.display = "none";
}

// Event binding
calcBtn.onclick = calculate;
copyBtn.onclick = copyResult;
scanBarcodeBtn.onclick = openScannerModal;
searchProductBtn.onclick = openSearchModal;
closeModalBtn.onclick = closeModal;
document.getElementById("editProductBtn").onclick = showCustomProductDialog;

updateProductUI();
calculate();
