frappe.pages['window-quotation'].on_page_load = function (wrapper) {
    // Frappe automatically injects the .html file's content into wrapper before on_page_load.
    // We capture it before make_app_page clears the wrapper.
    var custom_html = wrapper.innerHTML;

    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Window Quotation',
        single_column: true
    });

    // Inject captured HTML into the main section
    $(wrapper).find('.layout-main-section').html(custom_html);

    // Hide standard frappe page head to use our own UI
    setTimeout(function () {
        $(wrapper).find('.page-head').hide();
    }, 100);

    WQ.init(wrapper);
};

// ─────────────────────────────────────────────────────────────────────────────
// Main controller namespace
// ─────────────────────────────────────────────────────────────────────────────
var WQ = (function () {

    /* ── state ── */
    var _items = [];   // list of item objects staged in the create form
    var _editIdx = null; // index of item being edited (-1 = new)
    var _masterData = {}; // holds dynamic master types and items
    var customer_control = null;
    var dealer_control = null;

    /* ── DOM helpers ── */
    function $id(id) { return document.getElementById(id); }
    function show(el) { if (el) el.style.display = ''; }
    function hide(el) { if (el) el.style.display = 'none'; }

    /* ─────────────── PUBLIC INIT ─────────────── */
    function init(wrapper) {
        // Wait for the DOM to settle (Frappe page render delay)
        setTimeout(function () {
            _setupControls();
            _bindAll();
            _loadQuotations();
            _loadMasterData();
        }, 350);
    }

    function _setupControls() {
        var dp = $id('wq-dealer-wrapper');
        if (dp) {
            dealer_control = frappe.ui.form.make_control({
                parent: $(dp),
                df: { fieldname: 'dealer', fieldtype: 'Link', options: 'Window Dealer', placeholder: 'Select Dealer' },
                render_input: true,
                only_input: true
            });
            dealer_control.make_input();
        }

        var cp = $id('wq-customer-wrapper');
        if (cp) {
            customer_control = frappe.ui.form.make_control({
                parent: $(cp),
                df: { fieldname: 'customer', fieldtype: 'Link', options: 'Customer', placeholder: 'Select Customer', reqd: 1 },
                render_input: true,
                only_input: true
            });
            customer_control.make_input();
        }
    }

    /* ─────────────── BIND ALL EVENTS ─────────────── */
    function _bindAll() {
        // List view
        var btnNew = $id('wq-btn-create-new');
        if (btnNew) btnNew.onclick = showCreateForm;

        // Form view
        var btnCancel = $id('wq-form-cancel');
        var btnBack = $id('wq-back-to-list');
        var btnSave = $id('wq-form-save');
        var btnAdd = $id('wq-btn-add-item');
        if (btnCancel) btnCancel.onclick = showListView;
        if (btnBack) btnBack.onclick = showListView;
        if (btnSave) btnSave.onclick = saveQuotation;
        if (btnAdd) btnAdd.onclick = openAddItemDialog;

        // Dialog
        var dlgCancel = $id('wq-item-cancel');
        var dlgSave = $id('wq-item-save');
        if (dlgCancel) dlgCancel.onclick = closeAddItemDialog;
        if (dlgSave) dlgSave.onclick = _saveItem;

        // Live preview triggers
        ['wq-width', 'wq-height', 'wq-col-count'].forEach(function (id) {
            var el = $id(id);
            if (el) el.addEventListener('change', updatePreview);
            if (el) el.addEventListener('input', updatePreview);
        });

        // Dynamic filtering based on item type
        var typeEl = $id('wq-item-type');
        if (typeEl) {
            typeEl.addEventListener('change', function () {
                _renderMasterDataFields();
            });
        }

        // Rate → amount
        var rateEl = $id('wq-rate');
        if (rateEl) rateEl.addEventListener('input', _updateAmount);

        // Qty → amount
        var qtyEl = $id('wq-qty');
        if (qtyEl) qtyEl.addEventListener('input', _updateAmount);

        // Column count → rebuild tabs
        var colCount = $id('wq-col-count');
        if (colCount) colCount.addEventListener('change', function () {
            _buildColumnTabs(parseInt(this.value));
            updatePreview();
        });

        // Spec tabs
        var specOther = $id('wq-spec-other');
        var specAll = $id('wq-spec-all');
        if (specOther) specOther.onclick = function () {
            this.classList.add('active'); if (specAll) specAll.classList.remove('active');
        };
        if (specAll) specAll.onclick = function () {
            this.classList.add('active'); if (specOther) specOther.classList.remove('active');
        };
    }

    /* ─────────────── VIEW SWITCHING ─────────────── */
    function showListView() {
        show($id('wq-list-view'));
        hide($id('wq-form-view'));
        _items = [];
        _refreshItemsTable();
        _loadQuotations();
    }

    function showCreateForm() {
        hide($id('wq-list-view'));
        show($id('wq-form-view'));
        _items = [];
        _refreshItemsTable();
        // Reset controls
        if (customer_control) customer_control.set_value('');
        if (dealer_control) dealer_control.set_value('');
        if ($id('wq-note')) $id('wq-note').value = '';
    }

    /* ─────────────── LOAD QUOTATIONS (list) ─────────────── */
    function _loadQuotations() {
        var tbody = $id('wq-list-body');
        if (!tbody) return;

        frappe.call({
            method: 'ameen_app.api.get_window_quotations',
            args: { limit: 30 },
            callback: function (r) {
                if (r.message && r.message.status === 'success') {
                    var data = r.message.data;
                    if (!data || !data.length) {
                        tbody.innerHTML = '<tr><td colspan="9" class="wq-empty">' +
                            '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" style="margin-bottom:12px"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg><br>' +
                            'No quotations yet. Click <b>Create Quotation</b> to get started.' +
                            '</td></tr>';
                        return;
                    }
                    tbody.innerHTML = '';
                    data.forEach(function (q, i) {
                        var badge = _statusBadge(q.status);
                        var tr = document.createElement('tr');
                        tr.className = 'wq-list-row-link';
                        tr.innerHTML =
                            '<td>' + (i + 1) + '</td>' +
                            '<td style="font-weight:700;color:#1677ff;">' + (q.name || '') + '</td>' +
                            '<td>' + (q.customer || '—') + '</td>' +
                            '<td>' + (q.dealer || '—') + '</td>' +
                            '<td>' + (q.transaction_date || '—') + '</td>' +
                            '<td>' + (q.order_type || 'Regular') + '</td>' +
                            '<td style="text-align:center;">' + (q.total_qty || 0) + '</td>' +
                            '<td style="text-align:right;font-weight:700;">' + _currency(q.grand_total) + '</td>' +
                            '<td>' + badge + '</td>';
                        tbody.appendChild(tr);
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="9" class="wq-empty" style="color:#ef4444;">Failed to load quotations.</td></tr>';
                }
            }
        });
    }

    /* ─────────────── MASTER DATA DYNAMICS ─────────────── */
    function _loadMasterData() {
        frappe.call({
            method: 'ameen_app.master_data.api.get_master_data',
            callback: function (r) {
                if (r.message) {
                    _masterData = r.message;
                    _renderMasterDataFields();
                }
            }
        });
    }

    function _renderMasterDataFields() {
        var container = $id('wq-dynamic-master-fields');
        if (!container) return;

        var currentItemType = ($id('wq-item-type') || {}).value || 'Window'; // Default to Window
        var types = Object.keys(_masterData);
        var html = '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 14px;">';

        types.forEach(function (type) {
            var items = _masterData[type];
            var validItems = items.filter(function (it) {
                return !it.item_type || it.item_type === currentItemType;
            });

            // Do not show the Master Data Type selector if there are no matching options
            if (validItems.length === 0) return;

            html += '<div class="wq-selector" style="margin-bottom:0;">' +
                '<div class="wq-selector-left">' +
                '<div class="wq-selector-text">' +
                '<div class="wq-selector-label">' + type + '</div>' +
                '<select class="wq-selector-input wq-master-input" data-master-type="' + type + '" style="background:transparent;border:none;width:100%;outline:none;font-weight:600;color:#0f172a;cursor:pointer;">' +
                '<option value="">Select ' + type + '</option>';

            validItems.forEach(function (it) {
                html += '<option value="' + (it.item_code || it.item_name) + '">' + it.item_name + '</option>';
            });

            html += '</select>' +
                '</div>' +
                '</div>' +
                '<button class="wq-add-plus" onclick="frappe.set_route(\'Form\', \'Master Data Type\', \'' + type + '\')" title="Edit ' + type + '">+</button>' +
                '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
    }

    /* ─────────────── ADD ITEM DIALOG ─────────────── */
    function openAddItemDialog() {
        _editIdx = null;
        // Reset fields
        var typeEl = $id('wq-item-type');
        if (typeEl) {
            typeEl.value = 'Window'; // Default to Window
        }

        var particulars = $id('wq-particulars');
        if (particulars) particulars.value = '';

        // Force a re-render of master data for default Window type
        _renderMasterDataFields();

        // Reset dynamic master data fields
        document.querySelectorAll('.wq-master-input').forEach(function (el) {
            el.value = '';
        });
        ['wq-qty', 'wq-rate'].forEach(function (id) { var el = $id(id); if (el) el.value = (id === 'wq-qty' ? 1 : 0); });
        ['wq-width', 'wq-height'].forEach(function (id) { var el = $id(id); if (el) el.value = 300; });
        var cc = $id('wq-col-count'); if (cc) cc.value = '3';
        var ref = $id('wq-item-ref');
        if (ref) ref.textContent = 'REF' + String(_items.length + 1).padStart(4, '0');
        if ($id('wq-amount')) $id('wq-amount').value = '0.00';

        _buildColumnTabs(3);
        updatePreview();

        var overlay = $id('wq-add-item-overlay');
        if (overlay) overlay.classList.add('active');
    }

    function closeAddItemDialog() {
        var overlay = $id('wq-add-item-overlay');
        if (overlay) overlay.classList.remove('active');
    }

    function _saveItem() {
        var particulars = ($id('wq-particulars') || {}).value || '';
        var qty = parseInt(($id('wq-qty') || {}).value) || 1;
        var width = parseFloat(($id('wq-width') || {}).value) || 0;
        var height = parseFloat(($id('wq-height') || {}).value) || 0;

        if (!particulars) {
            frappe.msgprint({ title: 'Required', message: 'Particulars is required.', indicator: 'red' });
            return;
        }
        if (!width || !height) {
            frappe.msgprint({ title: 'Required', message: 'Width and Height are required.', indicator: 'red' });
            return;
        }

        var colCount = parseInt(($id('wq-col-count') || {}).value) || 1;
        var colDetails = [];
        for (var c = 1; c <= colCount; c++) {
            var cw = ($id('wq-col-width-' + c) || {}).value || '';
            var grll = ($id('wq-col-grill-' + c) || {}).value || '';
            colDetails.push({ col: c, width: cw, grill_type: grll });
        }

        var rate = parseFloat(($id('wq-rate') || {}).value) || 0;

        // Harvest dynamic master data
        var masterProps = {};
        document.querySelectorAll('.wq-master-input').forEach(function (el) {
            if (el.value) masterProps[el.getAttribute('data-master-type')] = el.value;
        });

        var actualItemType = ($id('wq-item-type') || {}).value || 'Window';

        var item = {
            item_no: _items.length + 1,
            item_type: actualItemType,
            particulars: particulars,
            qty: qty,
            width: width,
            height: height,
            column_count: colCount,
            column_details: JSON.stringify(colDetails),
            master_properties: JSON.stringify(masterProps),
            rate: rate,
            amount: qty * rate,
        };

        _items.push(item);
        _refreshItemsTable();
        closeAddItemDialog();
    }

    /* ─────────────── ITEMS TABLE (in form) ─────────────── */
    function _refreshItemsTable() {
        var tbody = $id('wq-items-body');
        var noRow = $id('wq-no-items-row');
        if (!tbody) return;

        // Remove all except the "no items" placeholder row
        Array.from(tbody.querySelectorAll('tr.wq-item-data')).forEach(function (tr) { tr.remove(); });

        if (!_items.length) {
            if (noRow) noRow.style.display = '';
            return;
        }
        if (noRow) noRow.style.display = 'none';

        _items.forEach(function (item, i) {
            var tr = document.createElement('tr');
            tr.className = 'wq-item-data';
            tr.innerHTML =
                '<td style="color:#64748b;">' + item.item_no + '</td>' +
                '<td style="font-weight:600;">' + item.item_type + '</td>' +
                '<td style="text-align:center;">' + item.qty + '</td>' +
                '<td>' + item.particulars + '<div style="font-size:11px;color:#94a3b8;margin-top:4px;">' +
                Object.keys(JSON.parse(item.master_properties || '{}')).map(function (k) { return k + ': ' + JSON.parse(item.master_properties || '{}')[k] }).join(', ') +
                '</div></td>' +
                '<td style="color:#64748b;font-size:13px;">' + item.width + ' × ' + item.height + ' mm</td>' +
                '<td style="text-align:center;">' + item.column_count + '</td>' +
                '<td style="text-align:right;">' +
                '<button onclick="WQ.removeItem(' + i + ')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:18px;line-height:1;" title="Remove">×</button>' +
                '</td>';
            tbody.appendChild(tr);
        });
    }

    /* ─────────────── SAVE QUOTATION ─────────────── */
    function saveQuotation() {
        var customer = customer_control ? customer_control.get_value() : '';
        if (!customer) {
            frappe.msgprint({ title: 'Required', message: 'Customer is required.', indicator: 'red' });
            return;
        }
        if (!_items.length) {
            frappe.msgprint({ title: 'No Items', message: 'Add at least one item before saving.', indicator: 'orange' });
            return;
        }

        var dealer = dealer_control ? dealer_control.get_value() : '';
        var note = ($id('wq-note') || {}).value || '';
        var orderTypes = document.querySelectorAll('input[name="wq-order-type"]');
        var orderType = 'Regular';
        orderTypes.forEach(function (r) { if (r.checked) orderType = r.value; });

        var btn = $id('wq-form-save');
        if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

        frappe.call({
            method: 'ameen_app.api.create_window_quotation',
            args: {
                customer: customer,
                dealer: dealer,
                note: note,
                order_type: orderType,
                items_json: JSON.stringify(_items),
            },
            callback: function (r) {
                if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
                if (r.message && r.message.status === 'success') {
                    frappe.msgprint({
                        title: '✅ Quotation Saved!',
                        message: 'Quotation <b>' + r.message.data.name + '</b> has been created successfully.',
                        indicator: 'green'
                    });
                    showListView();
                } else {
                    var err = (r.message && r.message.message) || 'Unknown error';
                    frappe.msgprint({ title: 'Error', message: err, indicator: 'red' });
                }
            }
        });
    }

    /* ─────────────── WINDOW PREVIEW SVG ─────────────── */
    function updatePreview() {
        var w = parseFloat(($id('wq-width') || {}).value) || 300;
        var h = parseFloat(($id('wq-height') || {}).value) || 300;
        var col = parseInt(($id('wq-col-count') || {}).value) || 1;

        var sub = $id('wq-preview-subtitle');
        if (sub) sub.textContent = 'Width: ' + w + ' | Height: ' + h + ' | Columns: ' + col;

        var svg = $id('wq-preview-svg');
        if (!svg) return;

        var svgW = 280, svgH = 240;
        var margin = 10;
        var frameX = margin, frameY = margin;
        var frameW = svgW - margin * 2;
        var frameH = svgH - margin * 2;
        var colW = frameW / col;
        var midY = frameY + frameH / 2;   // horizontal divider at mid-height

        var ns = 'http://www.w3.org/2000/svg';
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        // Outer frame
        var rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('x', frameX); rect.setAttribute('y', frameY);
        rect.setAttribute('width', frameW); rect.setAttribute('height', frameH);
        rect.setAttribute('fill', '#fff'); rect.setAttribute('stroke', '#1e293b'); rect.setAttribute('stroke-width', '4');
        svg.appendChild(rect);

        // Vertical column dividers
        for (var i = 1; i < col; i++) {
            var x = frameX + i * colW;
            var line = document.createElementNS(ns, 'line');
            line.setAttribute('x1', x); line.setAttribute('y1', frameY);
            line.setAttribute('x2', x); line.setAttribute('y2', frameY + frameH);
            line.setAttribute('stroke', '#1e293b'); line.setAttribute('stroke-width', '3');
            svg.appendChild(line);
        }

        // Horizontal rail at mid-height
        var hline = document.createElementNS(ns, 'line');
        hline.setAttribute('x1', frameX); hline.setAttribute('y1', midY);
        hline.setAttribute('x2', frameX + frameW); hline.setAttribute('y2', midY);
        hline.setAttribute('stroke', '#1e293b'); hline.setAttribute('stroke-width', '2.5');
        svg.appendChild(hline);

        // Inner pane lines (light) per column
        for (var c = 0; c < col; c++) {
            var cx1 = frameX + c * colW;
            var cx2 = frameX + (c + 1) * colW;
            var midX = cx1 + (cx2 - cx1) / 2;

            // Top half horizontal divider
            var tl = document.createElementNS(ns, 'line');
            tl.setAttribute('x1', cx1 + 1); tl.setAttribute('y1', frameY + frameH * 0.25);
            tl.setAttribute('x2', cx2 - 1); tl.setAttribute('y2', frameY + frameH * 0.25);
            tl.setAttribute('stroke', '#94a3b8'); tl.setAttribute('stroke-width', '1');
            svg.appendChild(tl);

            // Bottom half horizontal divider
            var bl = document.createElementNS(ns, 'line');
            bl.setAttribute('x1', cx1 + 1); bl.setAttribute('y1', frameY + frameH * 0.75);
            bl.setAttribute('x2', cx2 - 1); bl.setAttribute('y2', frameY + frameH * 0.75);
            bl.setAttribute('stroke', '#94a3b8'); bl.setAttribute('stroke-width', '1');
            svg.appendChild(bl);
        }
    }

    /* ─────────────── BUILD COLUMN TABS ─────────────── */
    function _buildColumnTabs(count) {
        var tabsEl = $id('wq-col-tabs');
        var panelsEl = $id('wq-col-panels');
        if (!tabsEl || !panelsEl) return;

        tabsEl.innerHTML = '';
        panelsEl.innerHTML = '';

        for (var i = 1; i <= count; i++) {
            (function (colNum) {
                var tab = document.createElement('button');
                tab.className = 'wq-tab' + (colNum === 1 ? ' active' : '');
                tab.textContent = 'Column ' + colNum;
                tab.onclick = function () {
                    tabsEl.querySelectorAll('.wq-tab').forEach(function (t) { t.classList.remove('active'); });
                    panelsEl.querySelectorAll('.wq-col-panel').forEach(function (p) { p.style.display = 'none'; });
                    this.classList.add('active');
                    var pnl = $id('wq-col-panel-' + colNum);
                    if (pnl) pnl.style.display = '';
                };
                tabsEl.appendChild(tab);

                var panel = document.createElement('div');
                panel.id = 'wq-col-panel-' + colNum;
                panel.className = 'wq-col-panel';
                panel.style.display = colNum === 1 ? '' : 'none';
                panel.innerHTML =
                    '<div class="wq-row-2">' +
                    '<div class="wq-field"><label>Column Width</label><input type="number" id="wq-col-width-' + colNum + '" value="' + Math.round(300 / count) + '" min="1"></div>' +
                    '<div class="wq-selector"><div class="wq-selector-left"><div class="wq-selector-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></svg></div>' +
                    '<div class="wq-selector-text"><div class="wq-selector-label">Grill Type <span style="color:#ef4444">*</span></div><input class="wq-selector-input" id="wq-col-grill-' + colNum + '" placeholder="Select Grill Type" type="text"></div></div>' +
                    '<button class="wq-add-plus">+</button></div>' +
                    '</div>';
                panelsEl.appendChild(panel);
            })(i);
        }
    }

    /* ─────────────── HELPERS ─────────────── */
    function _updateAmount() {
        var qty = parseFloat(($id('wq-qty') || {}).value) || 0;
        var rate = parseFloat(($id('wq-rate') || {}).value) || 0;
        var amtEl = $id('wq-amount');
        if (amtEl) amtEl.value = _currency(qty * rate);
    }

    function _currency(val) {
        return '₹ ' + parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function _statusBadge(status) {
        var cls = { Draft: 'wq-badge-draft', Submitted: 'wq-badge-submitted', Cancelled: 'wq-badge-cancelled' }[status] || 'wq-badge-draft';
        return '<span class="wq-badge ' + cls + '">' + (status || 'Draft') + '</span>';
    }

    /* ─────────────── PUBLIC SURFACE ─────────────── */
    return {
        init: init,
        showListView: showListView,
        showCreateForm: showCreateForm,
        openAddItemDialog: openAddItemDialog,
        updatePreview: updatePreview,
        removeItem: function (idx) {
            _items.splice(idx, 1);
            _items.forEach(function (it, i) { it.item_no = i + 1; });
            _refreshItemsTable();
        }
    };
})();
