/* Shared header/footer for the No Spin Media Voting Center.
   Each page sets `window.VC_BASE` (e.g. "" at root, "../" one level down)
   before loading this file, then calls vcRenderLayout(). Rendering the
   header/footer from one JS template (rather than 51+ copies of markup,
   or a fetch() that breaks under file://) is what keeps this a single
   reusable piece across every page, including generated state pages. */

function vcRenderLayout() {
    var base = (typeof window.VC_BASE === "string") ? window.VC_BASE : "";

    if (!document.querySelector(".vc-skip-link")) {
        document.body.insertAdjacentHTML(
            "afterbegin",
            '<a href="#main-content" class="vc-skip-link">Skip to main content</a>'
        );
    }

    var headerHTML =
        '<header>' +
            '<a href="' + base + 'index.html" class="header-logo-text">🧭 No Spin Media <span class="vc-badge">🗳️ Voting Center</span></a>' +
            '<button type="button" class="hamburger-menu" id="hamburger" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobile-nav">&#9776;</button>' +
            '<nav id="desktop-nav">' +
                '<a href="' + base + 'index.html">Home</a>' +
                '<a href="' + base + 'get-ready-to-vote.html">Get Ready</a>' +
                '<a href="' + base + 'ways-to-vote.html">Ways to Vote</a>' +
                '<a href="' + base + 'states/index.html">State Voting Guides</a>' +
                '<a href="' + base + 'faq.html">FAQ</a>' +
                '<a href="' + base + 'about.html">About</a>' +
                '<a class="vc-nsm-link" href="https://nospin.media/index.html" target="_blank" rel="noopener">No Spin Media ↗</a>' +
            '</nav>' +
        '</header>';

    var mobileLinks = [
        ["index.html", "Home"],
        ["get-ready-to-vote.html", "Get Ready to Vote"],
        ["ways-to-vote.html", "Ways to Vote"],
        ["polling-place.html", "Find My Polling Place"],
        ["voter-id.html", "Voter ID Requirements"],
        ["ballot.html", "What's on My Ballot?"],
        ["problems.html", "Voting Problems"],
        ["elections.html", "Upcoming Elections"],
        ["states/index.html", "State Voting Guides"],
        ["faq.html", "FAQ"],
        ["about.html", "About"]
    ];
    var mobileHTML = '<nav class="mobile-nav" id="mobile-nav" aria-label="Mobile">';
    mobileLinks.forEach(function (item) {
        mobileHTML += '<a href="' + base + item[0] + '">' + item[1] + '</a>';
    });
    mobileHTML += '<a class="vc-nsm-link" href="https://nospin.media/index.html" target="_blank" rel="noopener">🧭 No Spin Media Home ↗</a>';
    mobileHTML += '</nav>';

    var footerHTML =
        '<footer class="vc-footer">' +
            '<div class="vc-footer-inner">' +
                '<div class="vc-footer-col">' +
                    '<div class="vc-footer-title">🗳️ No Spin Media Voting Center</div>' +
                    '<p>Nonpartisan voter information and education. We explain how voting works and point you to official government sources &mdash; we never tell you who or what to vote for.</p>' +
                    '<p><a href="' + base + 'about.html">About the Voting Center</a> &middot; <a href="https://nospin.media/index.html" target="_blank" rel="noopener">No Spin Media</a></p>' +
                '</div>' +
                '<div class="vc-footer-col">' +
                    '<div class="vc-footer-title">Quick Links</div>' +
                    '<p><a href="' + base + 'get-ready-to-vote.html">Register to Vote</a></p>' +
                    '<p><a href="' + base + 'polling-place.html">Find My Polling Place</a></p>' +
                    '<p><a href="' + base + 'problems.html">Voting Problems</a></p>' +
                    '<p><a href="' + base + 'faq.html">Voting FAQ</a></p>' +
                '</div>' +
                '<div class="vc-footer-col">' +
                    '<div class="vc-footer-title">Official Resources</div>' +
                    '<p><a href="https://vote.gov" target="_blank" rel="noopener">Vote.gov ↗</a></p>' +
                    '<p><a href="https://www.eac.gov" target="_blank" rel="noopener">U.S. Election Assistance Commission ↗</a></p>' +
                    '<p><a href="https://www.fvap.gov" target="_blank" rel="noopener">Federal Voting Assistance Program ↗</a></p>' +
                '</div>' +
            '</div>' +
            '<div class="vc-footer-bottom">This page is nonpartisan and does not recommend candidates, parties, or positions. It is a section of <a href="https://nospin.media/index.html" target="_blank" rel="noopener">No Spin Media</a>, presented independently of the main news site.</div>' +
        '</footer>';

    var headerMount = document.getElementById("site-header");
    var footerMount = document.getElementById("site-footer");
    if (headerMount) headerMount.innerHTML = headerHTML + mobileHTML;
    if (footerMount) footerMount.innerHTML = footerHTML;

    var hamburger = document.getElementById("hamburger");
    var mobileNav = document.getElementById("mobile-nav");
    if (hamburger && mobileNav) {
        hamburger.onclick = function () {
            var isOpen = mobileNav.classList.toggle("open");
            hamburger.classList.toggle("active");
            hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
        };
        mobileNav.querySelectorAll("a").forEach(function (link) {
            link.onclick = function () {
                mobileNav.classList.remove("open");
                hamburger.classList.remove("active");
                hamburger.setAttribute("aria-expanded", "false");
            };
        });
    }

    vcRenderFeedbackForm();
}

/* ══════════════════════════════════════════════════════════════
   FEEDBACK / REPORT FORM — one reusable component, appended to
   <main> on every page (no per-page HTML to maintain). Reuses the
   exact same submission mechanism as the public Knowledge Base
   "Suggest an article" form on knowledge.html: a direct client-side
   POST to the same Google Apps Script endpoint, same {name, email,
   subject, message} payload shape, same honeypot spam field. No
   NSM backend/schema changes — Voting Center submissions are
   distinguished purely by a "Voting Center" subject-line prefix and
   a short metadata block (reason/state/section/page) folded into
   the message body, so nothing downstream needs to change to tell
   the two apart.
   ══════════════════════════════════════════════════════════════ */

var VC_FEEDBACK_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbwr26uY61Dip94_QwzyLh1JDSIFdYHJgqL_scKGLdRd9O42VLDBvt2XzkA67tjphJrs/exec";

/* Same 50 states + D.C. used by the state selector (js/main.js) —
   duplicated here in full rather than depended on, since not every
   page that needs this form also loads main.js. */
var VC_FEEDBACK_STATES = [
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

function vcFeedbackStateOptionsHTML(preselect) {
    var html = '<option value="">General (not state-specific)</option>';
    VC_FEEDBACK_STATES.forEach(function (pair) {
        var selected = (pair[0] === preselect) ? " selected" : "";
        html += '<option value="' + pair[0] + '"' + selected + '>' + pair[1] + '</option>';
    });
    return html;
}

function vcRenderFeedbackForm() {
    var main = document.querySelector("main");
    if (!main || document.getElementById("vc-feedback-mount")) return;

    var params = new URLSearchParams(window.location.search);
    var preselectState = (params.get("state") || "").toUpperCase();

    var mount = document.createElement("div");
    mount.id = "vc-feedback-mount";
    mount.innerHTML =
        '<div class="vc-feedback-card">' +
            '<h2>Have a Voting Question or Found an Update?</h2>' +
            '<p>Ask us a voting question, suggest information we should add, or let us know if something on this page may be outdated or incorrect.</p>' +
            '<form id="vc-feedback-form">' +
                '<div class="vc-feedback-row">' +
                    '<div>' +
                        '<label class="vc-sr-only" for="vc-fb-name">First name (optional)</label>' +
                        '<input type="text" id="vc-fb-name" placeholder="First name (optional)">' +
                    '</div>' +
                    '<div>' +
                        '<label class="vc-sr-only" for="vc-fb-email">Email (optional)</label>' +
                        '<input type="email" id="vc-fb-email" placeholder="you@email.com (optional)">' +
                    '</div>' +
                '</div>' +
                '<p class="vc-feedback-hint">We only need your email if you\'d like a reply — feel free to leave it blank.</p>' +
                '<div class="vc-feedback-row">' +
                    '<div>' +
                        '<label class="vc-sr-only" for="vc-fb-state">State or territory</label>' +
                        '<select id="vc-fb-state">' +
                            vcFeedbackStateOptionsHTML(preselectState) +
                        '</select>' +
                    '</div>' +
                    '<div>' +
                        '<label class="vc-sr-only" for="vc-fb-reason">Reason for contacting us</label>' +
                        '<select id="vc-fb-reason">' +
                            '<option value="Ask a voting question">Ask a voting question</option>' +
                            '<option value="Report outdated information">Report outdated information</option>' +
                            '<option value="Report incorrect information">Report incorrect information</option>' +
                            '<option value="Suggest an improvement">Suggest an improvement</option>' +
                            '<option value="Other">Other</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<label class="vc-sr-only" for="vc-fb-message">Your message (required)</label>' +
                '<textarea id="vc-fb-message" rows="4" placeholder="Your question, correction, or suggestion..." required></textarea>' +
                '<input type="text" id="vc-fb-honeypot" name="website" style="display:none;" tabindex="-1" autocomplete="off">' +
                '<div class="vc-feedback-privacy">Please don\'t include your voter registration number, Social Security number, driver\'s license or ID number, date of birth, or other sensitive personal information — this form is for questions and feedback about our published information, not for submitting anything used to determine your voting eligibility.</div>' +
                '<div class="vc-feedback-status" id="vc-fb-status"></div>' +
                '<button type="submit">Send to No Spin Media</button>' +
            '</form>' +
        '</div>';
    main.appendChild(mount);

    document.getElementById("vc-feedback-form").addEventListener("submit", vcSubmitFeedback);
}

function vcSubmitFeedback(e) {
    e.preventDefault();
    if (document.getElementById("vc-fb-honeypot").value) return;

    var statusEl = document.getElementById("vc-fb-status");
    statusEl.textContent = "⏳ Sending...";

    var reasonEl = document.getElementById("vc-fb-reason");
    var stateEl = document.getElementById("vc-fb-state");
    var reason = reasonEl.value;
    var stateLabel = stateEl.selectedOptions[0] ? stateEl.selectedOptions[0].textContent : "General (not state-specific)";
    var section = window.location.hash ? window.location.hash.replace("#", "") : "";
    var page = window.location.href;

    var subject = "Voting Center — " + reason + " — " + stateLabel;

    var bodyLines = [
        "Reason: " + reason,
        "State/Territory: " + stateLabel,
        "Section: " + (section || "(none)"),
        "Page: " + page,
        "",
        document.getElementById("vc-fb-message").value
    ];

    var data = {
        name: document.getElementById("vc-fb-name").value || "Someone",
        email: document.getElementById("vc-fb-email").value || "",
        subject: subject,
        message: bodyLines.join("\n")
    };

    fetch(VC_FEEDBACK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(data)
    }).then(function (res) {
        return res.json().catch(function () { return { status: "success" }; });
    }).then(function (result) {
        if (result.status === "success") {
            statusEl.textContent = "✅ Thanks! Your message was sent.";
            document.getElementById("vc-feedback-form").reset();
        } else {
            statusEl.textContent = "❌ Error sending. Please try again.";
        }
        setTimeout(function () { statusEl.textContent = ""; }, 6000);
    }).catch(function () {
        statusEl.textContent = "❌ Failed to send. Check your connection.";
        setTimeout(function () { statusEl.textContent = ""; }, 6000);
    });
}

document.addEventListener("DOMContentLoaded", vcRenderLayout);
