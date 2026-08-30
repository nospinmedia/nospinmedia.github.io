/* Reusable state-page template renderer.
   One HTML file (states/index.html) + this script covers all 50 states +
   D.C. (plus territories once added) — reading ?state=XX from the URL and
   fetching only that one jurisdiction's own file from data/states/<ID>.json
   or data/territories/<ID>.json, rather than existing as 51+ separately-
   maintained pages or loading every jurisdiction's data at once. Also
   fetches data/elections.json for the federal "next election" glance fact. */

var VC_SECTION_ORDER = [
    "register", "check_registration", "deadlines", "polling_place",
    "election_day", "polling_hours", "early_voting", "absentee_mail",
    "voter_id", "accessible_voting", "military_overseas", "student_voting",
    "sample_ballot", "contact", "official_resources"
];

/* Which sections get a compact tile in "at a glance." A constant here
   (rather than repeated per jurisdiction) since every state surfaces the
   same handful of high-value facts. */
var VC_GLANCE_SECTION_KEYS = ["deadlines", "early_voting", "voter_id", "absentee_mail"];

var VC_QUICK_ACTIONS = [
    { icon: "📝", title: "Register",           href: "#register" },
    { icon: "🔍", title: "Check Registration", href: "#check_registration" },
    { icon: "📍", title: "Polling Place",       href: "#polling_place" },
    { icon: "🪪", title: "Voting ID",           href: "#voter_id" },
    { icon: "✉️", title: "Absentee Voting",     href: "#absentee_mail" },
    { icon: "📅", title: "Election Dates",      href: "#deadlines" },
    { icon: "🧾", title: "Sample Ballot",       href: "#sample_ballot" },
    { icon: "🚧", title: "Voting Problems",     href: "../problems.html" }
];

var VC_STATUS_META = {
    verified:      { label: "Verified",      pill: "vc-pill-verified" },
    in_review:     { label: "In Review",     pill: "vc-pill-in-review" },
    needs_review:  { label: "Needs Review",  pill: "vc-pill-needs-review" },
    placeholder:   { label: "Placeholder",   pill: "vc-pill-placeholder" }
};

/* Per-state SEO control. State pages are one client-side-rendered
   template, so canonical/robots/description have to be set dynamically
   per ?state=XX rather than living as static tags in the HTML. Status
   drives indexing: placeholder/in_review states stay out of search
   (noindex, follow) until a state is verified, at which point this
   flips to index, follow automatically the next time the page loads —
   no manual step required when a state's status changes. */
function vcSetSeoTags(canonicalUrl, robotsContent, description) {
    var canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    var robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
    }
    robots.content = robotsContent;

    if (description) {
        var desc = document.querySelector('meta[name="description"]');
        if (desc) desc.content = description;
    }
}

function vcPillHTML(status) {
    var meta = VC_STATUS_META[status] || VC_STATUS_META.placeholder;
    return '<span class="vc-pill ' + meta.pill + '">' + meta.label + '</span>';
}

function vcQuickActionsHTML() {
    var html = '<div class="vc-quick-grid">';
    VC_QUICK_ACTIONS.forEach(function (a) {
        html += '<a class="vc-quick-card" href="' + a.href + '">' +
            '<div class="vc-quick-icon">' + a.icon + '</div>' +
            '<div class="vc-quick-title">' + a.title + '</div>' +
            '</a>';
    });
    html += '</div>';
    return html;
}

function vcStateBannerHTML(state) {
    if (state.status === "verified") {
        return '<div class="vc-banner vc-banner-trust">✅ <strong>Reviewed and verified.</strong>' +
            (state.last_verified ? ' Last verified ' + state.last_verified + '.' : '') +
            ' Rules can still change — the official links on this page are the source of truth.</div>';
    }
    if (state.status === "in_review") {
        return '<div class="vc-banner vc-banner-info">🔎 <strong>This state\'s information is currently being reviewed</strong> against official sources. Some details below may still be placeholder or in the process of being confirmed.</div>';
    }
    if (state.status === "needs_review") {
        return '<div class="vc-banner vc-banner-warning">⚠️ <strong>Some information on this page has been flagged for re-verification.</strong> What\'s shown below is the last known information — check the official source links for the latest before relying on it.</div>';
    }
    // placeholder (default)
    return '<div class="vc-banner vc-banner-placeholder">⚠️ <strong>This state\'s information is placeholder content.</strong> No Spin Media has not yet verified ' + state.name + '\'s voting rules against an official source. Use the quick actions and official links below to go straight to ' + state.name + '\'s official election authority.</div>';
}

function vcGlanceTileHTML(key, section) {
    var label = section.label;
    var value = section.glance_value || (section.status === "placeholder" ? "Not yet available" : "See details below");
    var html = '<div class="vc-glance-tile">';
    html += '<div class="vc-glance-label">' + label + '</div>';
    html += '<div class="vc-glance-value">' + value + '</div>';
    html += vcPillHTML(section.status);
    html += '</div>';
    return html;
}

function vcGlanceElectionTileHTML(title, dateLabel, description, status, sourceUrl, sourceName) {
    var html = '<div class="vc-glance-tile vc-glance-election">';
    html += '<div class="vc-glance-label">' + title + '</div>';
    html += '<div class="vc-glance-value">' + dateLabel + '</div>';
    if (description) html += '<p style="margin:0.2rem 0 0.5rem;color:#333;">' + description + '</p>';
    html += vcPillHTML(status);
    if (sourceUrl) {
        html += ' <a class="vc-official-link-inline" href="' + sourceUrl + '" target="_blank" rel="noopener">' + (sourceName || "Official Source") + ' ↗</a>';
    }
    html += '</div>';
    return html;
}

function vcGlanceHTML(state, federalElection) {
    var html = '<div class="vc-glance-card">';
    html += '<h2>🔎 ' + state.name + ' at a Glance</h2>';
    html += '<div class="vc-glance-grid">';

    if (federalElection) {
        html += vcGlanceElectionTileHTML(
            "Next Federal Election",
            federalElection.display_date || federalElection.date,
            federalElection.name,
            federalElection.status,
            federalElection.source_url,
            federalElection.source_name
        );
    }

    if (state.next_state_election) {
        var e = state.next_state_election;
        html += vcGlanceElectionTileHTML(
            "Next " + state.name + " Election",
            e.display_date || e.date || "Date not yet available",
            e.name,
            e.status,
            e.source_url,
            e.source_name
        );
    }

    VC_GLANCE_SECTION_KEYS.forEach(function (key) {
        var section = state.sections[key];
        if (section) html += vcGlanceTileHTML(key, section);
    });

    html += '</div>';

    if (state.glance_notes && state.glance_notes.length > 0) {
        html += '<div class="vc-glance-notes"><strong>Also worth knowing:</strong><ul>';
        state.glance_notes.forEach(function (note) {
            html += '<li>' + note.text + ' ' + vcPillHTML(note.status) +
                (note.source_url ? ' <a class="vc-official-link-inline" href="' + note.source_url + '" target="_blank" rel="noopener">' + (note.source_name || "Source") + ' ↗</a>' : '') +
                '</li>';
        });
        html += '</ul></div>';
    }

    html += '</div>';
    return html;
}

function vcFieldMetaHTML(section) {
    var parts = [];
    if (section.source_url) {
        parts.push('<a class="vc-official-link-inline" href="' + section.source_url + '" target="_blank" rel="noopener">' + (section.source_name || "Official Source") + ' ↗</a>');
    }
    parts.push(section.last_verified ? 'Verified ' + section.last_verified : 'Not yet verified');
    if (section.status === "needs_review" && section.flagged_reason) {
        parts.push('Flagged: ' + section.flagged_reason + (section.flagged_at ? ' (' + section.flagged_at + ')' : ''));
    }
    return '<div class="vc-field-meta">' + parts.map(function (p, i) {
        return (i > 0 ? '<span class="vc-dot"></span>' : '') + p;
    }).join('') + '</div>';
}

function vcFieldHTML(key, section, stateName) {
    var html = '<div class="vc-field" id="' + key + '">';
    html += '<div class="vc-field-head"><h3>' + section.label + '</h3>' + vcPillHTML(section.status) + '</div>';
    if (section.content) {
        html += '<p>' + section.content + '</p>';
    } else {
        html += '<p class="vc-muted">Not yet available for ' + stateName + '. Check the official source below.</p>';
    }
    html += vcFieldMetaHTML(section);
    html += '</div>';
    return html;
}

/* Loads exactly one jurisdiction's own file -- never the full collection.
   Tries data/states/<ID>.json first, then data/territories/<ID>.json (for
   AS/GU/MP/PR/VI once those are added), so the template doesn't need to
   know in advance which directory a given code lives in. Resolves to
   null (not a rejection) when neither exists, so the caller can show the
   normal "not recognized" message either way. */
function vcFetchJurisdictionData(stateId) {
    return fetch("../data/states/" + stateId + ".json").then(function (r) {
        if (r.ok) return r.json();
        return fetch("../data/territories/" + stateId + ".json").then(function (r2) {
            return r2.ok ? r2.json() : null;
        });
    }).catch(function () { return null; });
}

function vcRenderStatePage() {
    var params = new URLSearchParams(window.location.search);
    var stateParam = (params.get("state") || "").toUpperCase();

    var pickerWrap = document.getElementById("vc-state-picker");
    var contentWrap = document.getElementById("vc-state-content");

    var canonicalBase = window.location.origin + window.location.pathname;

    if (!stateParam) {
        vcSetSeoTags(canonicalBase, "index, follow");
        pickerWrap.style.display = "block";
        contentWrap.style.display = "none";
        return;
    }

    if (!/^[A-Z]{2}$/.test(stateParam)) {
        vcSetSeoTags(canonicalBase, "noindex, follow");
        contentWrap.innerHTML = '<div class="vc-wrap vc-narrow"><div class="vc-card"><p>We don\'t recognize that state code. <a href="index.html">Choose your state again</a>.</p></div></div>';
        pickerWrap.style.display = "none";
        contentWrap.style.display = "block";
        return;
    }

    Promise.all([
        vcFetchJurisdictionData(stateParam),
        fetch("../data/elections.json").then(function (r) { return r.json(); })
    ]).then(function (results) {
        var state = results[0];
        var electionsData = results[1];

        if (!state) {
            vcSetSeoTags(canonicalBase, "noindex, follow");
            contentWrap.innerHTML = '<div class="vc-wrap vc-narrow"><div class="vc-card"><p>We don\'t recognize that state code. <a href="index.html">Choose your state again</a>.</p></div></div>';
            pickerWrap.style.display = "none";
            contentWrap.style.display = "block";
            return;
        }

        document.title = state.name + " Voting Guide — No Spin Media Voting Center";
        vcSetSeoTags(
            canonicalBase + "?state=" + state.id,
            (state.status === "verified") ? "index, follow" : "noindex, follow",
            "Nonpartisan voter information for " + state.name + ": registration, deadlines, polling places, ID requirements, and official resources."
        );
        var federalElection = (electionsData.federal && electionsData.federal[0]) || null;

        var html = '';
        html += '<div class="vc-page-head"><h1>🗳️ ' + state.name + ' Voting Guide</h1>';
        html += '<p>Nonpartisan, state-specific voting information for ' + state.name + '. This explains the process and links to official sources — it never tells you who or what to vote for.</p></div>';
        html += '<div class="vc-wrap vc-narrow">';

        html += vcStateBannerHTML(state);

        html += '<h2 class="vc-section-title" style="margin-top:0;">⚡ Quick Actions</h2>';
        html += vcQuickActionsHTML();

        html += vcGlanceHTML(state, federalElection);

        html += '<h2 class="vc-section-title">📋 Detailed Information</h2>';
        html += '<div class="vc-card vc-section">';
        VC_SECTION_ORDER.forEach(function (key) {
            var section = state.sections[key];
            if (section) html += vcFieldHTML(key, section, state.name);
        });
        html += '</div>';

        if (state.id === "NH") {
            html += '<div class="vc-card vc-section">' +
                '<p class="vc-kb-note" style="margin-top:0;">📚 New Hampshire holds the first presidential primary in the nation. <a class="vc-kb-link" href="https://nospin.media/knowledge.html?id=20260802120031061" target="_blank" rel="noopener">Learn about the First-in-the-Nation Primary ↗</a></p>' +
                '</div>';
        }

        html += '<p style="margin-top:1.5rem;"><a href="index.html">← Choose a different state</a></p>';
        html += '</div>';

        contentWrap.innerHTML = html;
        pickerWrap.style.display = "none";
        contentWrap.style.display = "block";
    });
}

document.addEventListener("DOMContentLoaded", vcRenderStatePage);
