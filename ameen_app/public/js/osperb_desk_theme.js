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
            icon: "🏠",
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
            icon: "📊",
            title: "Accounting",
            sections: [
                {
                    title: "Accounting",
                    open: true,
                    links: [
                        { label: "Chart of Accounts", url: "/app/chart-of-accounts" },
                        { label: "Sales Invoice", url: "/app/sales-invoice" },
                        { label: "Purchase Invoice", url: "/app/purchase-invoice" },
                        { label: "Payment Entry", url: "/app/payment-entry" },
                        { label: "Journal Entry", url: "/app/journal-entry" },
                        { label: "Profit and Loss", url: "/app/profit-and-loss" },
                        { label: "Balance Sheet", url: "/app/balance-sheet" },
                        { label: "Trial Balance", url: "/app/trial-balance" },
                        { label: "General Ledger", url: "/app/general-ledger" },
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
            icon: "📦",
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
                        { label: "Stock Ledger", url: "/app/stock-ledger" },
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
            icon: "👥",
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
            icon: "🛒",
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
                        { label: "Sales Analytics", url: "/app/sales-analytics" },
                        { label: "Item-wise Sales Register", url: "/app/item-wise-sales-register" },
                    ],
                },
            ],
        },
        {
            key: "Buying",
            icon: "🧾",
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
                        { label: "Purchase Analytics", url: "/app/purchase-analytics" },
                    ],
                },
            ],
        },
        {
            key: "Settings",
            icon: "⚙️",
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
    function isDemoThemePage() {
        return window.location.pathname.includes("/osperb-demo");
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
            item.innerText = m.icon;
            item.addEventListener("click", () => setActive(m.key));
            if (idx === 0) item.classList.add("active");
            rail.appendChild(item);
        });

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

        document.body.appendChild(panel);
    }

    function buildSectionHTML(section, sectionIndex) {
        const sid = `os-sec-${sectionIndex}`;
        const openClass = section.open ? "open" : "";
        return `
      <div class="os-sec ${openClass}" data-sid="${sid}">
        <div class="os-sec-head" data-toggle="${sid}">
          <span>${section.title}</span>
          <span class="os-caret">${section.open ? "▾" : "▸"}</span>
        </div>
        <div class="os-sec-body" id="${sid}"></div>
      </div>
    `;
    }

    function attachAccordionBehavior(panel) {
        panel.querySelectorAll(".os-sec-head").forEach(head => {
            head.addEventListener("click", () => {
                const targetId = head.getAttribute("data-toggle");
                const body = panel.querySelector(`#${CSS.escape(targetId)}`);
                const caret = head.querySelector(".os-caret");

                const isOpen = body.style.display !== "none";
                body.style.display = isOpen ? "none" : "block";
                caret.innerText = isOpen ? "▸" : "▾";
            });
        });
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

            // Set initial open/close
            body.style.display = sec.open ? "block" : "none";

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
      }
      #${PANEL_ID} .os-sec-head:hover{ background: rgba(22,119,255,.09); }
      #${PANEL_ID} .os-sec-body{ padding: 8px 4px 2px; }
      #${PANEL_ID} .os-caret{ color:#64748B; font-weight:900; }
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
    }

    // SPA-ish: init multiple times safely
    document.addEventListener("DOMContentLoaded", init);
    setTimeout(init, 1200);
    window.addEventListener("popstate", () => setTimeout(init, 700));
})();
