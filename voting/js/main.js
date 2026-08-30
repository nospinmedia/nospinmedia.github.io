/* Shared helpers used by multiple pages: state-select dropdown + navigation. */

var VC_STATE_LIST = [
    ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
    ["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["DC","District of Columbia"],
    ["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],
    ["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],
    ["ME","Maine"],["MD","Maryland"],["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],
    ["MS","Mississippi"],["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],
    ["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],
    ["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],["OR","Oregon"],
    ["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],["SD","South Dakota"],
    ["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],["VA","Virginia"],
    ["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"]
];

function vcPopulateStateSelect(selectEl) {
    if (!selectEl) return;
    var opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Select your state…";
    selectEl.appendChild(opt);
    VC_STATE_LIST.forEach(function (pair) {
        var o = document.createElement("option");
        o.value = pair[0];
        o.textContent = pair[1];
        selectEl.appendChild(o);
    });
}

function vcInitStateSelector(containerId, basePath) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var select = container.querySelector("select");
    var button = container.querySelector("button");
    vcPopulateStateSelect(select);
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
