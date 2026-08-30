/* Searchable/filterable FAQ, driven entirely by data/faq.json. */

var VC_FAQ_DATA = null;
var VC_FAQ_ACTIVE_CAT = "all";

function vcFaqMatches(item, query) {
    if (!query) return true;
    var q = query.toLowerCase();
    return item.question.toLowerCase().indexOf(q) !== -1 ||
           item.answer.toLowerCase().indexOf(q) !== -1;
}

function vcRenderFaqList() {
    var listEl = document.getElementById("vc-faq-list");
    var query = document.getElementById("vc-faq-search").value.trim();
    var items = VC_FAQ_DATA.items.filter(function (item) {
        var catMatch = (VC_FAQ_ACTIVE_CAT === "all") || (item.category === VC_FAQ_ACTIVE_CAT);
        return catMatch && vcFaqMatches(item, query);
    });

    if (items.length === 0) {
        listEl.innerHTML = '<p class="vc-muted">No questions match your search. Try a different term or category.</p>';
        return;
    }

    var catLabel = {};
    VC_FAQ_DATA.categories.forEach(function (c) { catLabel[c.id] = c.label; });

    listEl.innerHTML = items.map(function (item) {
        return '<div class="vc-faq-item" data-id="' + item.id + '" role="button" tabindex="0" aria-expanded="false">' +
            '<div class="vc-faq-q"><h3>' + item.question + '</h3><span aria-hidden="true">▾</span></div>' +
            '<div class="vc-faq-tag">' + (catLabel[item.category] || item.category) + '</div>' +
            '<div class="vc-faq-a">' + item.answer + '</div>' +
            '</div>';
    }).join("");

    listEl.querySelectorAll(".vc-faq-item").forEach(function (el) {
        function toggle() {
            var isOpen = el.classList.toggle("open");
            el.setAttribute("aria-expanded", isOpen ? "true" : "false");
        }
        el.addEventListener("click", toggle);
        el.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                e.preventDefault();
                toggle();
            }
        });
    });
}

function vcRenderFaqCategories() {
    var catBar = document.getElementById("vc-faq-cats");
    var buttons = ['<button class="vc-faq-cat active" data-cat="all">All</button>'];
    VC_FAQ_DATA.categories.forEach(function (c) {
        buttons.push('<button class="vc-faq-cat" data-cat="' + c.id + '">' + c.label + '</button>');
    });
    catBar.innerHTML = buttons.join("");
    catBar.querySelectorAll(".vc-faq-cat").forEach(function (btn) {
        btn.addEventListener("click", function () {
            catBar.querySelectorAll(".vc-faq-cat").forEach(function (b) { b.classList.remove("active"); });
            btn.classList.add("active");
            VC_FAQ_ACTIVE_CAT = btn.getAttribute("data-cat");
            vcRenderFaqList();
        });
    });
}

function vcInitFaqPage() {
    var listEl = document.getElementById("vc-faq-list");
    if (!listEl) return;
    fetch("data/faq.json").then(function (r) { return r.json(); }).then(function (data) {
        VC_FAQ_DATA = data;
        vcRenderFaqCategories();
        vcRenderFaqList();
        document.getElementById("vc-faq-search").addEventListener("input", vcRenderFaqList);
    });
}

document.addEventListener("DOMContentLoaded", vcInitFaqPage);
