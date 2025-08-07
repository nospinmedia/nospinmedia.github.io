// script.js — Shopping List Utility V2.2

let shoppingList = [];

// EXPANDED KEYWORD MAP
const keywordMap = [
  { keywords: ["milk", "cheese", "yogurt", "eggs", "butter", "cream", "sour cream", "cottage cheese"], category: "Dairy" },
  { keywords: ["apple", "banana", "lettuce", "onion", "carrot", "grapes", "potato", "tomato", "spinach", "broccoli", "celery", "avocado", "orange", "lemon", "lime", "berries", "cilantro", "parsley"], category: "Produce" },
  { keywords: ["ice cream", "frozen", "pizza", "peas", "waffles", "vegetables", "burritos", "nuggets", "tater tots", "fries", "hash browns"], category: "Frozen" },
  { keywords: ["bread", "buns", "rolls", "bagel", "english muffin", "muffin", "tortilla", "pita", "baguette"], category: "Bread" },
  { keywords: ["cereal", "cheerios", "corn flakes", "raisin bran", "oatmeal", "strawberry cereal", "frosted flakes", "lucky charms", "cinnamon toast crunch"], category: "Cereal" },
  { keywords: ["chicken", "beef", "pork", "steak", "ground turkey", "sausage", "bacon", "ham", "hot dogs", "deli meat"], category: "Meat" },
  { keywords: ["salmon", "shrimp", "fish", "tilapia", "tuna", "clams", "scallops", "crab", "lobster"], category: "Seafood" },
  { keywords: ["beans", "rice", "pasta", "soup", "flour", "sugar", "salt", "pepper", "ketchup", "mustard", "mayo", "spaghetti sauce", "oil", "vinegar", "canned"], category: "Pantry & Dry Goods" },
  { keywords: ["chips", "crackers", "cookies", "snack", "popcorn", "pretzels", "goldfish", "granola bars", "oreos"], category: "Snacks" },
  { keywords: ["soda", "juice", "water", "coffee", "starbucks", "tea", "iced tea", "gatorade", "energy drink"], category: "Beverages" },
  { keywords: ["toothpaste", "soap", "shampoo", "deodorant", "mouthwash", "conditioner", "lotion", "hand sanitizer", "band-aids"], category: "Health & Beauty" },
  { keywords: ["detergent", "cleaner", "toilet paper", "dish soap", "sponges", "trash bags", "air freshener", "light bulbs"], category: "Household" },
  { keywords: ["medicine", "pain reliever", "allergy", "vitamins", "cold & flu"], category: "Pharmacy" }
];

const emojiMap = {
  "Produce": "🍎",
  "Dairy": "🧀",
  "Frozen": "🧊",
  "Bread": "🍞",
  "Cereal": "🥣",
  "Meat": "🥩",
  "Seafood": "🦐",
  "Pantry & Dry Goods": "🥫",
  "Snacks": "🍿",
  "Beverages": "🥤",
  "Health & Beauty": "💄",
  "Household": "🧺",
  "Pharmacy": "💊",
  "Other": "✨"
};

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

  const sortedCategories = Object.keys(grouped).sort();

  for (const category of sortedCategories) {
    const emoji = emojiMap[category] || "";
    const section = document.createElement('div');
    section.innerHTML = `<h3>${emoji} ${category}</h3>`;
    grouped[category].forEach(({ name, qty, index }) => {
      const row = document.createElement('div');
      row.className = "item-row";
      row.innerHTML = `
        <div class="item-name-col">
          <label>
            <input type="checkbox" />
            <span style="font-weight: bold;">${name}</span>
          </label>
        </div>
        <div class="item-controls-col">
          <span class="qty-label">Qty:</span>
          <input type="number" value="${qty}" min="1" onchange="updateQty(${index}, this.value)" />
          <select onchange="updateCategory(${index}, this.value)">
            ${[...sortedCategories, "Pantry & Dry Goods", "Pharmacy", "Produce", "Dairy", "Frozen", "Bread", "Cereal", "Meat", "Seafood", "Snacks", "Household", "Health & Beauty", "Other", "Beverages"].map(opt =>
              `<option value="${opt}" ${opt === category ? "selected" : ""}>${opt}</option>`
            ).join('')}
          </select>
        </div>
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
  const win = window.open("", "PrintWindow");
  const grouped = shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  let html = '<html><head><title>Shopping List</title></head><body>';
  html += '<h1>Shopping List</h1>';
  const sortedCategories = Object.keys(grouped).sort();
  for (const category of sortedCategories) {
    html += `<h3>${emojiMap[category] || ''} ${category}</h3><ul>`;
    grouped[category].forEach(item => {
      html += `<li>${item.name} (Qty: ${item.qty})</li>`;
    });
    html += '</ul>';
  }
  html += '</body></html>';
  win.document.write(html);
  win.document.close();
  win.print();
}

async function sendEmail() {
  const email = document.getElementById('emailInput').value.trim();
  const emailStatus = document.getElementById('emailStatus');
  const emailSenderUrl = 'https://script.google.com/macros/s/AKfycbwRMD0KhGcv8YGo-GFw2onU5PYldc19J50uGCqRuxbA2wSTj2y8uNZaBnp-DrbHr_rNjQ/exec';

  if (!email) {
    emailStatus.textContent = "❌ Please enter an email address.";
    emailStatus.style.color = "red";
    return;
  } else {
    emailStatus.style.color = "green";
    emailStatus.textContent = "⏳ Sending...";
  }

  const grouped = shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort();
  let emailBody = "Your Shopping List:\n\n";
  for (const category of sortedCategories) {
    emailBody += `--- ${emojiMap[category] || ''} ${category} ---\n`;
    grouped[category].forEach(item => {
      emailBody += `- ${item.name} (Qty: ${item.qty})\n`;
    });
    emailBody += "\n";
  }

  const payload = {
    email: email,
    subject: "Your Shopping List",
    message: emailBody
  };

  try {
    const response = await fetch(emailSenderUrl, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      emailStatus.textContent = "✅ Email sent successfully!";
    } else {
      throw new Error('Email failed to send.');
    }
  } catch (error) {
    emailStatus.textContent = "❌ Failed to send email.";
  }
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
    ) continue;

    const itemName = capitalize(line);
    const existing = shoppingList.find(i => i.name.toLowerCase() === itemName.toLowerCase());
    if (existing) {
      existing.qty += 1;
    } else {
      const category = autoCategory(itemName);
      shoppingList.push({ name: itemName, qty: 1, category });
    }
  }
  
  saveList();
  renderList();
}

function clearList() {
  if (confirm("Are you sure you want to clear the list?")) {
    shoppingList = [];
    saveList();
    renderList();
  }
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

// FEEDBACK FORM LOGIC
document.addEventListener('DOMContentLoaded', function() {
  const feedbackForm = document.getElementById('feedbackForm');
  const formStatus = document.getElementById('formStatus');
  const feedbackUrl = 'https://script.google.com/macros/s/AKfycbwr26uY61Dip94_QwzyLh1JDSIFdYHJgqL_scKGLdRd9O42VLDBvt2XzkA67tjphJrs/exec';

  if (feedbackForm) {
    feedbackForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      formStatus.textContent = "⏳ Sending...";
      
      const data = {
        name: document.getElementById('name').value || "Someone",
        email: document.getElementById('email').value,
        subject: "Shopping List Feedback",
        message: document.getElementById('message').value
      };
      
      try {
        const res = await fetch(feedbackUrl, {
          method: 'POST',
          headers: {'Content-Type':'text/plain'},
          body: JSON.stringify(data)
        });
        if (res.ok) {
          formStatus.textContent = "✅ Thanks! Your feedback was sent.";
          feedbackForm.reset();
          setTimeout(()=>{ formStatus.textContent = ""; }, 4000);
        } else {
          throw new Error('Failed to send feedback.');
        }
      } catch(err) {
        formStatus.textContent = "❌ Failed to send!";
      }
    });
  }
});
