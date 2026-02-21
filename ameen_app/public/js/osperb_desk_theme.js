// Osperb Desk Theme Injector (Icon Rail + Collapsible Submenu Panel)
// - Creates left icon-only rail (blue)
// - Creates white submenu panel with collapsible sections like screenshot
// Safe: no core patches, DOM injection only.

(function () {
    const RAIL_ID = "osperb-rail";
    const PANEL_ID = "osperb-panel";

    // ------------------------------------------------------------
    // 1) CONFIG: modules (icon rail) -> sections (collapsible panel)
    // ------------------------------------------------------------
    // Use URLs as /app/<route>. Most ERPNext screens are /app/<doctype> or /app/<report>/<name>.
    // If a link does not exist / user doesn't have permission, it will be hidden.

    const NAV = [
        {
            key: "Home",
            icon: `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
            title: "Home",
            sections: [
                {
                    title: "Home",
                    open: true,
                    links: [
                        { label: "Home (Osperb Blue)", url: "/app/workspace/Home%20(Osperb%20Blue)" },
                        { label: "Home", url: "/app/workspace/Home" },
                    ],
                },
            ],
        },
        {
            key: "Accounting",
            icon: `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>`,
            title: "Accounting",
            sections: [
                {
                    title: "Accounting",
                    open: true,
                    links: [
                        { label: "Chart of Accounts", url: "/app/account" },
                        { label: "Sales Invoice", url: "/app/sales-invoice" },
                        { label: "Purchase Invoice", url: "/app/purchase-invoice" },
                        { label: "Payment Entry", url: "/app/payment-entry" },
                        { label: "Journal Entry", url: "/app/journal-entry" },
                        { label: "Profit and Loss", url: "/app/query-report/Profit%20and%20Loss" },
                        { label: "Balance Sheet", url: "/app/query-report/Balance%20Sheet" },
                        { label: "Trial Balance", url: "/app/query-report/Trial%20Balance" },
                        { label: "General Ledger", url: "/app/query-report/General%20Ledger" },
                    ],
                },
                {
                    title: "Masters",
                    open: false,
                    links: [
                        { label: "Company", url: "/app/company" },
                        { label: "Account", url: "/app/account" },
                        { label: "Mode of Payment", url: "/app/mode-of-payment" },
                        { label: "Bank Account", url: "/app/bank-account" },
                    ],
                },
                {
                    title: "Tools",
                    open: false,
                    links: [
                        { label: "Period Closing Voucher", url: "/app/period-closing-voucher" },
                        { label: "Opening Invoice Creation Tool", url: "/app/opening-invoice-creation-tool" },
                    ],
                },
            ],
        },
        {
            key: "Stock",
            icon: `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
            title: "Stock",
            sections: [
                {
                    title: "Stock",
                    open: true,
                    links: [
                        { label: "Item", url: "/app/item" },
                        { label: "Warehouse", url: "/app/warehouse" },
                        { label: "Brand", url: "/app/brand" },
                        { label: "Unit of Measure (UOM)", url: "/app/uom" },
                        { label: "Stock Ledger", url: "/app/query-report/Stock%20Ledger" },
                        { label: "Stock Reconciliation", url: "/app/stock-reconciliation" },
                    ],
                },
                {
                    title: "Transactions",
                    open: false,
                    links: [
                        { label: "Stock Entry", url: "/app/stock-entry" },
                        { label: "Delivery Note", url: "/app/delivery-note" },
                        { label: "Purchase Receipt", url: "/app/purchase-receipt" },
                    ],
                },
            ],
        },
        {
            key: "CRM",
            icon: `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
            title: "CRM",
            sections: [
                {
                    title: "CRM",
                    open: true,
                    links: [
                        { label: "Lead", url: "/app/lead" },
                        { label: "Customer", url: "/app/customer" },
                        { label: "Customer Group", url: "/app/customer-group" },
                        { label: "Territory", url: "/app/territory" },
                        { label: "Opportunity", url: "/app/opportunity" },
                    ],
                },
            ],
        },
        {
            key: "Selling",
            icon: `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
            title: "Selling",
            sections: [
                {
                    title: "Selling",
                    open: true,
                    links: [
                        { label: "Quotation", url: "/app/quotation" },
                        { label: "Sales Order", url: "/app/sales-order" },
                        { label: "Sales Invoice", url: "/app/sales-invoice" },
                        { label: "Customer", url: "/app/customer" },
                        { label: "Item", url: "/app/item" },
                    ],
                },
                {
                    title: "POS",
                    open: true,
                    links: [
                        { label: "Point of Sale", url: "/app/point-of-sale" },
                        { label: "POS Profile", url: "/app/pos-profile" },
                        { label: "POS Opening Entry", url: "/app/pos-opening-entry" },
                        { label: "POS Closing Entry", url: "/app/pos-closing-entry" },
                    ],
                },
                {
                    title: "Reports",
                    open: false,
                    links: [
                        { label: "Sales Analytics", url: "/app/query-report/Sales%20Analytics" },
                        { label: "Item-wise Sales Register", url: "/app/query-report/Item-wise%20Sales%20Register" },
                    ],
                },
            ],
        },
        {
            key: "Buying",
            icon: `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
            title: "Buying",
            sections: [
                {
                    title: "Buying",
                    open: true,
                    links: [
                        { label: "Supplier", url: "/app/supplier" },
                        { label: "Purchase Order", url: "/app/purchase-order" },
                        { label: "Purchase Invoice", url: "/app/purchase-invoice" },
                        { label: "Item", url: "/app/item" },
                    ],
                },
                {
                    title: "Reports",
                    open: false,
                    links: [
                        { label: "Purchase Analytics", url: "/app/query-report/Purchase%20Analytics" },
                    ],
                },
            ],
        },
        {
            key: "Settings",
            icon: `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
            title: "Settings",
            sections: [
                {
                    title: "Settings",
                    open: true,
                    links: [
                        { label: "Global Defaults", url: "/app/global-defaults" },
                        { label: "System Settings", url: "/app/system-settings" },
                        { label: "Users", url: "/app/user" },
                        { label: "Role Permissions Manager", url: "/app/role-permission-manager" },
                        { label: "Workspace", url: "/app/workspace" },
                    ],
                },
                {
                    title: "Data Import and Settings",
                    open: false,
                    links: [
                        { label: "Import Data", url: "/app/data-import" },
                        { label: "Opening Invoice Creation Tool", url: "/app/opening-invoice-creation-tool" },
                    ],
                },
            ],
        },
    ];

    // ------------------------------------------------------------
    // 2) Helpers
    // ------------------------------------------------------------
    let panelTimeout;
    let isPinned = localStorage.getItem('osperb-panel-pinned') === 'true';

    function checkPinnedState() {
        if (isPinned) {
            document.body.classList.add('osperb-panel-open', 'osperb-panel-pinned');
        } else {
            document.body.classList.remove('osperb-panel-pinned');
        }
    }

    function showPanel() {
        if (isPinned) return;
        clearTimeout(panelTimeout);
        document.body.classList.add('osperb-panel-open');
    }

    function hidePanel() {
        if (isPinned) return;
        panelTimeout = setTimeout(() => {
            document.body.classList.remove('osperb-panel-open');
        }, 150);
    }

    function togglePin() {
        isPinned = !isPinned;
        localStorage.setItem('osperb-panel-pinned', isPinned);
        checkPinnedState();
        if (!isPinned) {
            document.body.classList.remove('osperb-panel-open');
        }
    }

    function isDemoThemePage() {
        return window.location.pathname.startsWith("/app");
    }

    function removeIfExists(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    async function urlExists(url) {
        // Some endpoints redirect; treat 200/3xx as OK
        try {
            const res = await fetch(url, { method: "GET", credentials: "same-origin" });
            return res.ok;
        } catch (e) {
            return false;
        }
    }

    // ------------------------------------------------------------
    // 3) UI Builders
    // ------------------------------------------------------------
    function createRail() {
        removeIfExists(RAIL_ID);

        const rail = document.createElement("div");
        rail.id = RAIL_ID;

        const logo = document.createElement("div");
        logo.className = "os-logo";
        logo.innerText = "O";
        rail.appendChild(logo);

        NAV.forEach((m, idx) => {
            const item = document.createElement("div");
            item.className = "os-item";
            item.dataset.key = m.key;
            item.title = m.key;
            item.innerHTML = m.icon;
            item.addEventListener("click", () => setActive(m.key));
            item.addEventListener("mouseenter", () => setActive(m.key));
            if (idx === 0) item.classList.add("active");
            rail.appendChild(item);
        });

        rail.addEventListener("mouseenter", showPanel);
        rail.addEventListener("mouseleave", hidePanel);

        document.body.appendChild(rail);
    }

    function createPanel() {
        removeIfExists(PANEL_ID);

        const panel = document.createElement("div");
        panel.id = PANEL_ID;

        panel.innerHTML = `
      <div class="os-title">Home</div>
      <div class="os-sections"></div>
    `;

        panel.addEventListener("mouseenter", showPanel);
        panel.addEventListener("mouseleave", hidePanel);

        document.body.appendChild(panel);
    }

    function buildSectionHTML(section, sectionIndex) {
        const sid = `os-sec-${sectionIndex}`;
        return `
      <div class="os-sec" data-sid="${sid}">
        <div class="os-sec-head" data-toggle="${sid}">
          <span>${section.title}</span>
          <span class="os-caret"></span>
        </div>
        <div class="os-sec-body" id="${sid}"></div>
      </div>
    `;
    }

    function attachAccordionBehavior(panel) {
        // Menu opens natively via CSS hover now
    }

    async function renderSections(moduleKey) {
        const panel = document.getElementById(PANEL_ID);
        if (!panel) return;

        const module = NAV.find(m => m.key === moduleKey) || NAV[0];
        panel.querySelector(".os-title").innerText = module.title;

        const sectionsWrap = panel.querySelector(".os-sections");
        sectionsWrap.innerHTML = "";

        // Render skeleton of sections
        module.sections.forEach((sec, i) => {
            sectionsWrap.insertAdjacentHTML("beforeend", buildSectionHTML(sec, i));
        });

        // Fill each section with valid links
        for (let i = 0; i < module.sections.length; i++) {
            const sec = module.sections[i];
            const body = sectionsWrap.querySelector(`#os-sec-${i}`);
            if (!body) continue;

            // Removed inline block/none so CSS hover works smoothly
            body.style.display = "";

            for (const link of sec.links) {
                const exists = await urlExists(link.url);
                if (!exists) continue;

                const a = document.createElement("a");
                a.className = "os-link";
                a.href = link.url;
                a.innerHTML = `<div style="font-size:18px;">•</div><div><div>${link.label}</div><small>${sec.title}</small></div>`;
                body.appendChild(a);
            }

            // If empty, hide section
            if (!body.children.length) {
                body.parentElement.style.display = "none";
            }
        }

        // Accordion click handlers
        attachAccordionBehavior(panel);

        // Add styles for accordion heads (inline to avoid another CSS edit)
        injectAccordionCSSOnce();

        // Optional staggered load animation for smoother transitions
        const secs = sectionsWrap.querySelectorAll('.os-sec');
        secs.forEach((sec, idx) => {
            sec.style.opacity = "0";
            sec.style.animation = `os-fade-slide 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards ${idx * 0.04}s`;
        });
    }

    function injectAccordionCSSOnce() {
        if (document.getElementById("osperb-accordion-css")) return;
        const style = document.createElement("style");
        style.id = "osperb-accordion-css";
        style.innerHTML = `
      #${PANEL_ID} .os-sec{ margin-bottom: 10px; }
      #${PANEL_ID} .os-sec-head{
        display:flex; align-items:center; justify-content:space-between;
        font-weight:800; color:#0F172A; cursor:pointer;
        padding:10px 10px; border-radius: 14px;
        background: rgba(22,119,255,.06);
        border: 1px solid rgba(15,23,42,.06);
        transition: all .2s ease;
      }
      #${PANEL_ID} .os-sec-head:hover{ background: rgba(22,119,255,.09); }
      #${PANEL_ID} .os-sec-body{ padding: 8px 4px 2px; display: none; }
      #${PANEL_ID} .os-sec:hover .os-sec-body { display: block; }
      #${PANEL_ID} .os-caret{ color:#64748B; font-weight:900; }
      #${PANEL_ID} .os-caret::before { content: "▸"; }
      #${PANEL_ID} .os-sec:hover .os-caret::before { content: "▾"; }
    `;
        document.head.appendChild(style);
    }

    function setActive(moduleKey) {
        document.querySelectorAll(`#${RAIL_ID} .os-item`).forEach(el => {
            el.classList.toggle("active", el.dataset.key === moduleKey);
        });
        renderSections(moduleKey);
    }

    function init() {
        if (!isDemoThemePage()) {
            document.body.classList.remove('osperb-theme-active');
            removeIfExists(RAIL_ID);
            removeIfExists(PANEL_ID);
            return;
        }
        document.body.classList.add('osperb-theme-active');
        if (document.getElementById(RAIL_ID)) return; // already mounted

        createRail();
        createPanel();
        renderSections("Home");
        checkPinnedState();
    }

    // SPA-ish: init multiple times safely
    document.addEventListener("DOMContentLoaded", init);
    setTimeout(init, 1200);
    window.addEventListener("popstate", () => setTimeout(init, 700));

    // Global listener for Frappe's Toggle Sidebar button
    document.addEventListener("click", (e) => {
        const toggleBtn = e.target.closest('.sidebar-toggle-btn, [title="Toggle Sidebar"], [data-original-title="Toggle Sidebar"]');
        if (toggleBtn) {
            // Unfocus button to remove focus styles
            toggleBtn.blur();
            togglePin();
        }
    });

})();
