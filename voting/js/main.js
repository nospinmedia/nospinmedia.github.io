/* Shared helpers used by multiple pages: state-select dropdown + navigation.
   The jurisdiction list itself comes from vcFetchJurisdictions(), defined
   in js/layout.js (loaded on every page before this file) -- see that
   file for why it lives there rather than here. */

function vcPopulateStateSelect(selectEl, jurisdictions) {
    if (!selectEl) return;
    var opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Select your state…";
    selectEl.appendChild(opt);
    jurisdictions.forEach(function (j) {
        var o = document.createElement("option");
        o.value = j.id;
        o.textContent = j.name;
        selectEl.appendChild(o);
    });
}

function vcInitStateSelector(containerId, basePath) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var select = container.querySelector("select");
    var button = container.querySelector("button");

    vcFetchJurisdictions(basePath).then(function (jurisdictions) {
        vcPopulateStateSelect(select, jurisdictions);
    });

    function go() {
        if (select.value) {
            window.location.href = (basePath || "") + "states/index.html?state=" + select.value;
        }
    }
    if (button) button.onclick = go;
    if (select) select.onchange = go;
}

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-vc-state-selector]").forEach(function (el) {
        vcInitStateSelector(el.id, el.getAttribute("data-base") || "");
    });
});
