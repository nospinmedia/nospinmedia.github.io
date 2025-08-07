// script.js — V1.5 logic for Shopping List Utility

const keywordMap = [
  { keywords: ["milk", "cheese", "yogurt", "eggs", "butter", "sour cream", "cream cheese", "cottage cheese", "whipped cream"], category: "Dairy" },
  { keywords: ["apple", "banana", "lettuce", "onion", "carrot", "grapes", "broccoli", "spinach", "cucumber", "tomato", "potato", "avocado"], category: "Produce" },
  { keywords: ["ice cream", "frozen", "pizza", "peas", "waffles", "vegetables", "fruit", "nuggets", "burrito"], category: "Frozen" },
  { keywords: ["bread", "buns", "rolls", "bagel", "english muffin", "tortilla", "pita", "muffin"], category: "Bread" },
  { keywords: ["cereal", "cheerios", "corn flakes", "raisin bran", "oatmeal", "granola", "pancake", "syrup"], category: "Cereal" },
  { keywords: ["chicken", "beef", "pork", "steak", "lamb", "sausage", "bacon", "turkey", "ground pork"], category: "Meat" },
  { keywords: ["salmon", "shrimp", "fish", "tilapia", "tuna"], category: "Seafood" },
  { keywords: ["beans", "rice", "pasta", "soup", "spaghetti sauce", "canned"], category: "Canned & Dry Goods" },
  { keywords: ["chips", "crackers", "cookies", "snack", "pretzels", "popcorn", "nuts"], category: "Snacks" },
  { keywords: ["soda", "juice", "water", "coffee", "tea", "starbucks"], category: "Beverages" },
  { keywords: ["toothpaste", "soap", "shampoo", "deodorant", "lotion", "vitamins"], category: "Health & Beauty" },
  { keywords: ["detergent", "cleaner", "bar keepers", "toilet paper", "trash bags"], category: "Household" },
];

function getCategory(itemName) {
  const lower = itemName.toLowerCase();
  for (const map of keywordMap) {
    if (map.keywords.some(word => lower.includes(word))) {
      return map.category;
    }
  }
  return "Other";
}

function addItem() {
  const name = document.getElementById("itemInput").value.trim();
  const qty = document.getElementById("qtyInput").value || 1;
  let category = document.getElementById("categorySelect").value;
  if (!name) return;

  if (category === "Other") {
    category = getCategory(name);
  }

  const itemRow = document.createElement("div");
  itemRow.className = "item-row";

  itemRow.innerHTML = `
    <input type="checkbox" />
    <span contenteditable="true">${name}</span>
    (<span contenteditable="true">QTY ${qty}</span>) — 
    <select onchange="saveList(this)">
      ${[...document.querySelectorAll('#categorySelect option')].map(opt => `
        <option value="${opt.value}" ${opt.value === category ? "selected" : ""}>${opt.value}</option>`).join("")}
    </select>
  `;

  document.getElementById("shoppingList").appendChild(itemRow);
  document.getElementById("itemInput").value = "";
  document.getElementById("qtyInput").value = "";
  document.getElementById("categorySelect").value = "Other";
  saveList();
}

function importItems() {
  const raw = document.getElementById("importBox").value;
  const cleaned = raw.split(/\n+/).filter(line => {
    return line && !/Added|Edited|Edit|Delete|Show/i.test(line);
  });
  cleaned.forEach(item => {
    document.getElementById("itemInput").value = item.trim();
    addItem();
  });
  document.getElementById("importBox").value = "";
}

function exportCSV() {
  const rows = document.querySelectorAll("#shoppingList .item-row");
  const csv = ["Item,Quantity,Category"];
  rows.forEach(row => {
    const name = row.children[1].innerText.trim();
    const qtyText = row.children[2].innerText.match(/\d+/);
    const qty = qtyText ? qtyText[0] : "1";
    const category = row.querySelector("select").value;
    csv.push(`"${name}",${qty},${category}`);
  });
  const blob = new Blob([csv.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "shopping-list.csv";
  link.click();
}

function printList() {
  window.print();
}

function sendEmail() {
  const email = document.getElementById("emailInput").value.trim();
  if (!email) return alert("Enter a valid email.");
  const rows = document.querySelectorAll("#shoppingList .item-row");
  let body = "Shopping List:\n\n";
  rows.forEach(row => {
    const name = row.children[1].innerText.trim();
    const qtyText = row.children[2].innerText.match(/\d+/);
    const qty = qtyText ? qtyText[0] : "1";
    const category = row.querySelector("select").value;
    body += `- ${name} (Qty ${qty}) [${category}]\n`;
  });

  fetch("https://script.google.com/macros/s/YOUR_ENDPOINT_HERE/exec", {
    method: "POST",
    body: JSON.stringify({ to: email, subject: "Your Shopping List", message: body }),
  }).then(r => alert("Email sent (if configured)."));
}

function saveList() {
  localStorage.setItem("shoppingList", document.getElementById("shoppingList").innerHTML);
}

window.addEventListener("load", () => {
  const saved = localStorage.getItem("shoppingList");
  if (saved) document.getElementById("shoppingList").innerHTML = saved;
});
