/* Renders data/elections.json. State/local elections are placeholder
   architecture only for now — see elections.json's state_and_local block. */

function vcRenderElections() {
    var federalEl = document.getElementById("vc-federal-elections");
    var placeholderEl = document.getElementById("vc-state-local-placeholder");
    if (!federalEl) return;

    fetch("data/elections.json").then(function (r) { return r.json(); }).then(function (data) {
        federalEl.innerHTML = data.federal.map(function (item) {
            return '<div class="vc-field">' +
                '<h3>' + item.name + ' <span class="vc-pill vc-pill-verified">Verified</span></h3>' +
                '<p><strong>' + (item.display_date || item.date) + '</strong> — ' + item.description + '</p>' +
                '<a class="vc-official-link" href="' + item.source_url + '" target="_blank" rel="noopener">Official Source ↗</a>' +
                (item.kb_link ? '<p class="vc-kb-note"><a class="vc-kb-link" href="' + item.kb_link + '" target="_blank" rel="noopener">' + item.kb_label + ' ↗</a></p>' : '') +
                '<div class="vc-last-verified">Last verified: ' + item.last_verified + '</div>' +
                '</div>';
        }).join("");

        if (placeholderEl && data.state_and_local) {
            placeholderEl.innerHTML =
                '<div class="vc-placeholder-box">' +
                '<div style="font-size:2rem;">🚧</div>' +
                '<p><strong>State and local election dates are coming soon.</strong></p>' +
                '<p>' + data.state_and_local.note + '</p>' +
                '</div>';
        }
    });
}

document.addEventListener("DOMContentLoaded", vcRenderElections);
