// script.js — Shopping List Utility V1.5.2

let shoppingList = [];

const keywordMap = [
  { keywords: ["milk", "cheese", "yogurt", "eggs", "butter", "cream"], category: "Dairy" },
  { keywords: ["apple", "banana", "lettuce", "onion", "carrot", "grapes", "potato", "tomato", "spinach"], category: "Produce" },
  { keywords: ["ice cream", "frozen", "pizza", "peas", "waffles", "vegetables"], category: "Frozen" },
  { keywords: ["bread", "buns", "rolls", "bagel", "english muffin", "muffin"], category: "Bread" },
  { keywords: ["cereal", "cheerios", "corn flakes", "raisin bran", "oatmeal", "strawberry cereal"], category: "Cereal" },
  { keywords: ["chicken", "beef", "pork", "steak", "ground turkey"], category: "Meat" },
  { keywords: ["salmon", "shrimp", "fish", "tilapia", "tuna"], category: "Seafood" },
  { keywords: ["beans", "rice", "pasta", "soup", "flour", "sugar"], category: "Canned & Dry Goods" },
  { keywords: ["chips", "crackers", "cookies", "snack", "popcorn"], category: "Snacks" },
  { keywords: ["soda", "juice", "water", "coffee", "starbucks"], category: "Beverages" },
  { keywords: ["toothpaste", "soap", "shampoo", "deodorant"], category: "Health & Beauty" },
  { keywords: ["detergent", "cleaner", "bar keepers", "toilet paper"], category: "Household" }
];

function autoCategory(itemName) {
  const name = itemName.toLowerCase();
  for (const map of keywordMap) {
    if (map.keywords.some(keyword => name.includes(keyword))) {
      return map.category;
    }
  }
  return "Other";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function addItem() {
  const itemName = document.getElementById('itemInput').value.trim();
  let qty = parseInt(document.getElementById('qtyInput').value);
  if (!itemName) return;
  if (!qty || qty < 1) qty = 1;

  const smartCategory = autoCategory(itemName);
  const existing = shoppingList.find(i => i.name.toLowerCase() === itemName.toLowerCase());
  if (existing) {
    existing.qty += qty;
  } else {
    shoppingList.push({ name: capitalize(itemName), qty, category: smartCategory });
  }
  document.getElementById('itemInput').value = "";
  document.getElementById('qtyInput').value = "";
  renderList();
  saveList();
}

function renderList() {
  const container = document.getElementById('shoppingList');
  container.innerHTML = "";

  const grouped = shoppingList.reduce((acc, item, idx) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push({ ...item, index: idx });
    return acc;
  }, {});

  for (const category in grouped) {
    const section = document.createElement('div');
    section.innerHTML = `<h3>${category}</h3>`;
    grouped[category].forEach(({ name, qty, index }) => {
      const row = document.createElement('div');
      row.className = "item-row";
      row.innerHTML = `
        <input type="checkbox" />
        <span style="margin-left: 0.5rem; margin-right: 1rem;">${name}</span>
        <small style="margin-right: 1rem;">Qty:</small>
        <input type="number" value="${qty}" min="1" onchange="updateQty(${index}, this.value)" style="width: 50px; margin-right: 1rem;" />
        <select onchange="updateCategory(${index}, this.value)" style="margin-right: 1rem;">
          ${["Produce", "Dairy", "Frozen", "Bread", "Cereal", "Meat", "Seafood", "Snacks", "Household", "Health & Beauty", "Other"].map(opt =>
            `<option value="${opt}" ${opt === grouped[category][0].category ? "selected" : ""}>${opt}</option>`
          ).join('')}
        </select>
        <button onclick="removeItem(${index})">🗑️</button>
      `;
      section.appendChild(row);
    });
    container.appendChild(section);
  }
}

function removeItem(index) {
  shoppingList.splice(index, 1);
  renderList();
  saveList();
}

function updateQty(index, newQty) {
  shoppingList[index].qty = parseInt(newQty) || 1;
  saveList();
}

function updateCategory(index, newCategory) {
  shoppingList[index].category = newCategory;
  renderList();
  saveList();
}

function exportCSV() {
  const rows = [["Item", "Qty", "Category"], ...shoppingList.map(item => [item.name, item.qty, item.category])];
  const csvContent = rows.map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "shopping_list.csv");
  link.click();
}

function printList() {
  window.print();
}

function sendEmail() {
  const email = document.getElementById('emailInput').value.trim();
  if (!email) return alert("Please enter an email.");
  const payload = {
    to: email,
    subject: "Your Shopping List",
    body: shoppingList.map(i => `${i.name} (Qty: ${i.qty}) — ${i.category}`).join("\n")
  };
  fetch("https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec", {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(res => alert("Email sent!"));
}

function importItems() {
  const rawText = document.getElementById("importBox").value;
  const lines = rawText.split("\n").map(line => line.trim()).filter(line => line);

  const skipPhrases = [
    "Add Item", "Show search result", "Edit", "Delete", "Added", "Edited", "Me Added", "John Added"
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      skipPhrases.some(skip => line.includes(skip)) ||
      /^\w+ Added \d+/.test(line) ||
      /^Edited \d+/.test(line)
    ) {
      continue;
    }

    const itemName = capitalize(line);
    const existing = shoppingList.find(i => i.name.toLowerCase() === itemName.toLowerCase());
    if (existing) {
      existing.qty += 1;
    } else {
      const category = autoCategory(itemName);
      shoppingList.push({ name: itemName, qty: 1, category, checked: false });
    }
  }

  saveList();
  renderList();
}

function saveList() {
  localStorage.setItem("shoppingList", JSON.stringify(shoppingList));
}

function loadList() {
  const saved = localStorage.getItem("shoppingList");
  if (saved) {
    shoppingList = JSON.parse(saved);
    renderList();
  }
}

window.onload = loadList;
