<p align="center">
  <img src="food-fusilli-pasta-reginette-svgrepo-com.svg" alt="MacroCalc Logo" width="80"/>
</p>

<h1 align="center">MacroCalc — Калькулятор порций макарон, риса и круп</h1>

<p align="center">
  <em>Рассчитайте вес сухих макарон в порции за секунду</em>
</p>

<p align="center">
  <a href="https://belozerovmi.github.io/Pasta_Calculator-API/">
    <img src="https://img.shields.io/badge/Сайт-Открыть-%231e2d4c?style=for-the-badge" alt="Сайт-открыть">
  </a>
  <a href="https://github.com/Belozerovmi/Pasta_Calculator-API">
    <img src="https://img.shields.io/badge/Репозиторий-Открыть-%231e2d4c?style=for-the-badge&logo=github" alt="Репозиторий">
  </a>
</p>

---

## О проекте

**MacroCalc** — это веб-приложение для расчета веса сухих макарон, риса и круп в готовой порции. Проект написан на нативных **HTML5**, **CSS3** и **JavaScript** без использования фреймворков. Данные о продуктах подтягиваются из Open Food Facts API с кэшированием в localStorage.

---

## Функционал

<p align="center">
  <img src="https://img.shields.io/badge/Категорий-3-%231e2d4c?style=flat-square" alt="Категорий">
  <img src="https://img.shields.io/badge/PWA-Готов-%23acbdaa?style=flat-square" alt="PWA">
</p>

### Калькулятор порций

Основной экран с тремя категориями продуктов:

- **Макароны** — твёрдые сорта (коэффициент разваривания: 100г → 240г)
- **Рис** — белый рис (коэффициент: 100г → 300г)
- **Крупы** — гречка, перловка, булгур и др. (коэффициент: 100г → 250г)

**Поля ввода:**
- Сухие до варки (всего) — граммы
- Готовые после варки (всего) — граммы
- Ваша порция (готовые) — граммы

После нажатия кнопки **"Рассчитать порцию"** появляется модальное окно с результатом:
- Вес сухих макарон в порции
- КБЖУ порции (калории, белки, жиры, углеводы)
- Кнопка копирования веса в буфер обмена

### Поиск продукта

- Ручной поиск по названию через Open Food Facts API
- Поиск по штрихкоду через камеру (HTML5 QR Code Scanner)
- Поддержка вспышки при сканировании на мобильных устройствах
- Автодополнение и debounce 500ms для оптимизации запросов

### История продуктов

- Сохраняет последние 30 просмотренных продуктов
- Отображает 15 продуктов с кнопкой "Показать ещё"
- Каждый продукт имеет иконку категории (макароны, рис, крупы)
- Кнопка удаления отдельного продукта из истории
- Кнопка "Очистить всё"
- При клике на продукт из истории — подставляется в карточку

### Создание своего продукта

- Модальное окно для создания пользовательского продукта
- Поля: название, калорийность, белки, жиры, углеводы (на 100г)
- Сохранение в историю и локальное хранилище

### Подсказка по развариванию

- Динамическая подсказка под категориями:
  - Макароны: "100г сухих макарон ≈ 240г варёных"
  - Рис: "100г сухого риса ≈ 300г варёного"
  - Крупы: "100г сухой крупы ≈ 250г варёной"

---

## Технологический стек

<div align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"/>
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA"/>
  <img src="https://img.shields.io/badge/Open_Food_Facts-FFCC00?style=for-the-badge&logo=openfoodfacts&logoColor=black" alt="Open Food Facts"/>
</div>

- Семантическая верстка HTML5
- CSS3 — медиазапросы (4 брейкпоинта), Flexbox, Grid Layout, анимации
- JavaScript ES6+ — Fetch API, Web Crypto API, LocalStorage, Service Workers
- HTML5 QR Code — сканирование штрихкодов через камеру
- Open Food Facts API — поиск продуктов по названию и штрихкоду
- PWA — манифест и Service Worker для работы офлайн

---

### Структура проекта:

```markdown

Pasta_Calculator-API/
├── index.html # Главная страница
├── style.css # Стили приложения
├── script.js # Основная логика
├── sw.js # Service Worker (PWA)
├── manifest.json # PWA манифест
├── app.js # Конфигурация PWA
├── food-fusilli-pasta-reginette-svgrepo-com.svg # Логотип
├── favicon.ico # Иконка сайта
└── icons/ # Иконки для PWA (72px — 512px)

```

---

## API и кэширование

- **Источник данных**: `https://world.openfoodfacts.org/`
- **Поиск**: `/cgi/search.pl?search_terms=...&json=1`
- **По штрихкоду**: `/api/v0/product/{barcode}.json`
- **Кэширование**: localStorage (история продуктов, 30 записей)
- **Offline режим**: Service Worker с стратегией Stale-While-Revalidate

---

## Категоризация и коэффициенты разваривания

| Категория | Коэффициент (100г сухих → готовых) | Подсказка |
|-----------|-------------------------------------|-----------|
| Макароны  | 100г → 240г | 100г сухих макарон ≈ 240г варёных |
| Рис       | 100г → 300г | 100г сухого риса ≈ 300г варёного |
| Крупы     | 100г → 250г | 100г сухой крупы ≈ 250г варёной |

---

## Цветовая схема

| Роль | Цвет |
|------|------|
| Основной цвет (фон карточек, акценты) | `#1e2d4c` |
| Второстепенный (кнопки, бордеры) | `#acbdaa` |
| Фон карточки продукта | `#f6f8f4` |
| Текст основной | `#1e2d4c` |
| Текст второстепенный | `#858585` |
| Фон модальных окон | `#ffffff` |

---

## Установка и запуск

1. **Клонируйте репозиторий**
```bash
   git clone https://github.com/Belozerovmi/Pasta_Calculator-API.git
```
   
2. **Перейдите в папку проекта**
```bash
cd Pasta_Calculator-API
```

3. **Откройте index.html в браузере**

> Можно просто дважды кликнуть по файлу или использовать Live Server в VS Code

4. **Для PWA (установка на телефон)**

> Откройте сайт через HTTPS или localhost, нажмите "Установить приложение" в браузере

<p align="center">made by belozerov</p>
