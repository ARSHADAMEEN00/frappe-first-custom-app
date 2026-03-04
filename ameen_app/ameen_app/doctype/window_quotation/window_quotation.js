// Copyright (c) 2026, ameen and contributors
// For license information, please see license.txt

// ─── Master Data Cache ────────────────────────────────────────────────────────
var _wq_master_data = null;
var _wq_master_data_loading = false;
var _wq_master_data_callbacks = [];

/**
 * Fetch master data with proper queuing.
 * If a fetch is already in flight, queues the callback instead of firing
 * a duplicate request. This prevents race conditions on first open.
 */
function _fetch_master_data(callback) {
    if (_wq_master_data) {
        callback(_wq_master_data);
        return;
    }

    // Queue this callback
    _wq_master_data_callbacks.push(callback);

    // If already loading, don't start another request
    if (_wq_master_data_loading) {
        return;
    }

    _wq_master_data_loading = true;
    frappe.call({
        method: 'ameen_app.master_data.api.get_master_data',
        callback: function (r) {
            _wq_master_data = r.message || {};
            _wq_master_data_loading = false;

            // Drain the queue — call ALL waiting callbacks
            var cbs = _wq_master_data_callbacks.slice();
            _wq_master_data_callbacks = [];
            cbs.forEach(function (cb) {
                cb(_wq_master_data);
            });
        },
        error: function () {
            _wq_master_data_loading = false;
            _wq_master_data_callbacks = [];
        }
    });
}

/**
 * "Channel Size" → "channel_size"
 */
function _to_fieldname(type_name) {
    return type_name.toLowerCase().replace(/\s+/g, '_');
}

// ─── Loading Overlay ──────────────────────────────────────────────────────────
var _LOADER_ID = 'wq-master-data-loader';

function _show_loading(grid_row) {
    if (!grid_row || !grid_row.grid_form) return;
    var wrapper = grid_row.grid_form.wrapper;
    var $wrapper = wrapper instanceof jQuery ? wrapper : $(wrapper);
    if ($wrapper.find('#' + _LOADER_ID).length) return;

    $wrapper.css('position', 'relative');
    $wrapper.append(
        '<div id="' + _LOADER_ID + '" style="' +
        'position:absolute;inset:0;z-index:20;' +
        'background:rgba(255,255,255,0.88);' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'border-radius:8px;gap:12px;' +
        '">' +
        '<div style="' +
        'width:32px;height:32px;border-radius:50%;' +
        'border:3px solid #e2e8f0;border-top-color:#1677ff;' +
        'animation:wq-spin 0.7s linear infinite;' +
        '"></div>' +
        '<span style="color:#64748b;font-size:13px;font-weight:500;">Loading master data…</span>' +
        '</div>' +
        '<style>' +
        '@keyframes wq-spin{to{transform:rotate(360deg)}}' +
        '</style>'
    );
}

function _hide_loading(grid_row) {
    if (!grid_row || !grid_row.grid_form) return;
    var wrapper = grid_row.grid_form.wrapper;
    var $wrapper = wrapper instanceof jQuery ? wrapper : $(wrapper);
    $wrapper.find('#' + _LOADER_ID).remove();
}

// ─── Apply Master Data Options ────────────────────────────────────────────────

function _apply_master_data_options(frm, cdt, cdn) {
    var grid = frm.fields_dict.items && frm.fields_dict.items.grid;
    var grid_row = grid && grid.get_row(cdn);

    // Show loading overlay while data is being fetched (first load only)
    if (!_wq_master_data && grid_row) {
        _show_loading(grid_row);
    }

    _fetch_master_data(function (master_data) {
        // Data is ready — now wait for grid_form to be rendered, then apply
        _wait_for_grid_form_and_apply(frm, cdt, cdn, master_data, 0);
    });
}

/**
 * Wait for grid_form to be available, then apply options.
 * Separated from fetch to ensure we ALWAYS apply AFTER data is ready.
 */
function _wait_for_grid_form_and_apply(frm, cdt, cdn, master_data, attempt) {
    var row = locals[cdt] && locals[cdt][cdn];
    if (!row) return;

    var grid = frm.fields_dict.items && frm.fields_dict.items.grid;
    if (!grid) return;

    var grid_row = grid.get_row(cdn);
    if (!grid_row) return;

    var dialog_fields = grid_row.grid_form && grid_row.grid_form.fields_dict;

    // Retry until grid_form is fully rendered (up to ~2.4 seconds)
    if (!dialog_fields) {
        if (attempt < 30) {
            setTimeout(function () {
                _wait_for_grid_form_and_apply(frm, cdt, cdn, master_data, attempt + 1);
            }, 80);
        }
        return;
    }

    // Grid form is ready AND data is loaded — hide loading and apply
    _hide_loading(grid_row);
    _do_apply_options(frm, cdt, cdn, master_data, dialog_fields, grid_row);
}

/**
 * Apply Select conversion + hide/show to all master data fields.
 * Called ONLY when both master_data AND dialog_fields are ready.
 */
function _do_apply_options(frm, cdt, cdn, master_data, dialog_fields, grid_row) {
    var row = locals[cdt] && locals[cdt][cdn];
    if (!row) return;

    var item_type = row.item_type || 'Window';

    Object.keys(master_data).forEach(function (type_name) {
        var fieldname = _to_fieldname(type_name);
        var items = master_data[type_name] || [];
        var field_widget = dialog_fields[fieldname];
        if (!field_widget) return; // field not in schema — skip

        // Filter: only items matching the selected item_type
        // Items with no item_type apply to all types
        var valid = items.filter(function (it) {
            return !it.item_type || it.item_type === item_type;
        });

        if (valid.length === 0) {
            // ── No items for this combo → HIDE the field ──────────────────
            field_widget.df.hidden = 1;
            field_widget.refresh();
            if (row[fieldname]) {
                frappe.model.set_value(cdt, cdn, fieldname, '');
            }
        } else {
            // ── Has valid items → SHOW as Select with filtered options ─────
            var new_options = '\n' + valid.map(function (it) {
                return it.item_name;
            }).join('\n');

            // Build new df with Select fieldtype
            var new_df = $.extend({}, field_widget.df, {
                hidden: 0,
                fieldtype: 'Select',
                options: new_options
            });

            // Replace the control entirely — Frappe creates control instances
            // based on fieldtype (ControlData vs ControlSelect), so just
            // changing df.fieldtype won't re-instantiate the control class.
            _replace_field_control(grid_row, fieldname, new_df);

            // Clear value if it's no longer valid after type change
            if (row[fieldname] && !valid.find(function (it) {
                return it.item_name === row[fieldname];
            })) {
                frappe.model.set_value(cdt, cdn, fieldname, '');
            }
        }
    });
}

/**
 * Replace a field control in the grid form with a new one matching
 * the updated df (e.g. changing Data → Select).
 *
 * This properly re-instantiates the Frappe control class so the DOM
 * element matches the new fieldtype.
 */
function _replace_field_control(grid_row, fieldname, new_df) {
    var form = grid_row.grid_form;
    if (!form || !form.layout) return;

    var layout = form.layout;
    var old_field = layout.fields_dict[fieldname];
    if (!old_field) return;

    // Use layout.replace_field if available (Frappe v14+)
    // This properly handles replacing the control, updating fields_dict, etc.
    if (typeof layout.replace_field === 'function') {
        layout.replace_field(fieldname, new_df, true);
        // After replace, refresh the new field with current doc
        var new_field = layout.fields_dict[fieldname];
        if (new_field) {
            new_field.doc = grid_row.doc;
            new_field.docname = grid_row.doc.name;
            new_field.refresh();
        }
    } else {
        // Fallback: manually rebuild the control
        var $wrapper = old_field.$wrapper;
        if (!$wrapper || !$wrapper.length) return;

        // Create new control
        var parent_el = $wrapper.parent().get(0);
        var new_field = frappe.ui.form.make_control({
            df: new_df,
            parent: parent_el,
            doctype: grid_row.doc.doctype,
            docname: grid_row.doc.name,
            frm: grid_row.frm,
            doc: grid_row.doc,
            render_input: true
        });

        if (new_field) {
            // Replace the old wrapper with the new one
            $wrapper.replaceWith(new_field.$wrapper);
            new_field.refresh();

            // Update references
            layout.fields_dict[fieldname] = new_field;
            form.fields_dict[fieldname] = new_field;

            // Also update in fields_list
            var idx = layout.fields_list.findIndex(function (f) {
                return f === old_field;
            });
            if (idx !== -1) {
                layout.fields_list[idx] = new_field;
            }
        }
    }
}

// ─── Tab Navigation System ────────────────────────────────────────────────────

/**
 * Inject tabbed UI CSS once per page load
 */
var _wq_tabs_css_injected = false;
function _inject_tabs_css() {
    if (_wq_tabs_css_injected) return;
    _wq_tabs_css_injected = true;

    var css = `
        /* ── Tab Container ────────────────────────────────── */
        .wq-tabs-container {
            margin: -15px -15px 0 -15px;
        }
        .wq-tabs-header {
            display: flex;
            background: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            padding: 0;
        }
        .wq-tab-btn {
            flex: 1;
            padding: 14px 20px;
            border: none;
            background: transparent;
            font-size: 14px;
            font-weight: 600;
            color: #94a3b8;
            cursor: pointer;
            position: relative;
            transition: all 0.25s ease;
            outline: none;
            text-align: center;
        }
        .wq-tab-btn:hover:not(.wq-tab-disabled) {
            color: #475569;
            background: #f1f5f9;
        }
        .wq-tab-btn.wq-tab-active {
            color: #1677ff;
            background: #fff;
        }
        .wq-tab-btn.wq-tab-active::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            right: 0;
            height: 2px;
            background: #1677ff;
        }
        .wq-tab-btn.wq-tab-disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
        .wq-tab-btn .wq-tab-icon {
            margin-right: 8px;
            font-size: 15px;
        }
        .wq-tab-btn .wq-tab-check {
            margin-left: 8px;
            color: #22c55e;
            font-size: 13px;
        }

        /* ── Tab Panels ───────────────────────────────────── */
        .wq-tab-panel {
            display: none;
            padding: 20px 15px;
            animation: wq-fade-in 0.2s ease;
        }
        .wq-tab-panel.wq-tab-panel-active {
            display: block;
        }
        @keyframes wq-fade-in {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Tab 1: Select Item Type ──────────────────────── */
        .wq-item-type-panel {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 220px;
            gap: 24px;
        }
        .wq-item-type-panel h3 {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
        }
        .wq-item-type-panel p {
            font-size: 13px;
            color: #94a3b8;
            margin: -12px 0 0 0;
        }
        .wq-item-type-select-wrapper {
            width: 100%;
            max-width: 320px;
        }
        .wq-item-type-select-wrapper select {
            width: 100%;
            padding: 10px 14px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 500;
            color: #1e293b;
            background: #fff;
            transition: border-color 0.2s;
            outline: none;
            appearance: auto;
        }
        .wq-item-type-select-wrapper select:focus {
            border-color: #1677ff;
            box-shadow: 0 0 0 3px rgba(22,119,255,0.12);
        }
        .wq-next-btn {
            padding: 10px 36px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            color: #fff;
            background: #1677ff;
            cursor: pointer;
            transition: all 0.2s;
        }
        .wq-next-btn:hover:not(:disabled) {
            background: #0958d9;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(22,119,255,0.3);
        }
        .wq-next-btn:disabled {
            background: #cbd5e1;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        /* ── Locked badge ─────────────────────────────────── */
        .wq-locked-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            color: #15803d;
        }
        .wq-locked-badge .lock-icon {
            font-size: 12px;
        }
    `;

    $('head').append('<style id="wq-tabs-styles">' + css + '</style>');
}

/**
 * Build the two-tab UI structure inside a grid row's edit form.
 *
 * @param {object} frm - parent form
 * @param {string} cdt - child doctype
 * @param {string} cdn - child doc name
 * @param {object} grid_row - the grid row object
 */
function _build_tabbed_ui(frm, cdt, cdn, grid_row) {
    _inject_tabs_css();

    var row = locals[cdt] && locals[cdt][cdn];
    if (!row) return;

    var $form_area = $(grid_row.grid_form.wrapper);

    // Prevent double-injection
    if ($form_area.find('.wq-tabs-container').length) return;

    var has_item_type = !!(row.item_type && row.item_type.trim());

    // ── Collect all original form content ──────────────────────────────────
    var $original_content = $form_area.children().detach();

    // ── Build tab structure ────────────────────────────────────────────────
    var tab1_check = has_item_type ? ' <span class="wq-tab-check">✓</span>' : '';

    var $tabs = $(`
        <div class="wq-tabs-container">
            <div class="wq-tabs-header">
                <button class="wq-tab-btn wq-tab-active" data-tab="1">
                    <span class="wq-tab-icon">①</span>Select Item Type${tab1_check}
                </button>
                <button class="wq-tab-btn ${has_item_type ? '' : 'wq-tab-disabled'}" data-tab="2">
                    <span class="wq-tab-icon">②</span>Item Details
                </button>
            </div>

            <div class="wq-tab-panel wq-tab-panel-active" data-tab-panel="1">
                <div class="wq-item-type-panel">
                    <h3>Select Item Type</h3>
                    <p>Choose the item type for this row. Once selected, it cannot be changed.</p>
                    <div class="wq-item-type-select-wrapper">
                        <!-- select will be injected here -->
                    </div>
                    <button class="wq-next-btn" ${has_item_type ? '' : 'disabled'}>
                        Next →
                    </button>
                </div>
            </div>

            <div class="wq-tab-panel" data-tab-panel="2">
                <!-- original form content goes here -->
            </div>
        </div>
    `);

    // ── Insert original content into Tab 2 ────────────────────────────────
    $tabs.find('[data-tab-panel="2"]').append($original_content);

    // ── Build the Item Type select for Tab 1 ──────────────────────────────
    var item_type_options = [
        '', 'Window', 'Door Frame', 'Door', 'Mesh Window', 'Grill Window',
        'Ventilator Window', 'Fully Finished Window', 'Fully Finished Door',
        'Door Cum Window'
    ];

    if (has_item_type) {
        // Item type already selected — show locked badge instead of select
        $tabs.find('.wq-item-type-select-wrapper').html(
            '<div class="wq-locked-badge">' +
            '<span class="lock-icon">🔒</span> ' +
            row.item_type +
            '</div>'
        );
        $tabs.find('.wq-item-type-panel p').text(
            'Item type is locked for this row. To use a different type, create a new row.'
        );
        $tabs.find('.wq-next-btn').text('Next → Item Details').prop('disabled', false);
    } else {
        // New row — show the select dropdown
        var select_html = '<select class="wq-item-type-select">';
        select_html += '<option value="">-- Select Item Type --</option>';
        item_type_options.forEach(function (opt) {
            if (opt) {
                select_html += '<option value="' + opt + '">' + opt + '</option>';
            }
        });
        select_html += '</select>';
        $tabs.find('.wq-item-type-select-wrapper').html(select_html);
    }

    // ── Append to form ────────────────────────────────────────────────────
    $form_area.append($tabs);

    // ── Tab switching logic ───────────────────────────────────────────────
    $tabs.find('.wq-tab-btn').on('click', function () {
        var $btn = $(this);
        if ($btn.hasClass('wq-tab-disabled')) return;

        var tab_id = $btn.data('tab');
        // Deactivate all tabs
        $tabs.find('.wq-tab-btn').removeClass('wq-tab-active');
        $tabs.find('.wq-tab-panel').removeClass('wq-tab-panel-active');
        // Activate clicked tab
        $btn.addClass('wq-tab-active');
        $tabs.find('[data-tab-panel="' + tab_id + '"]').addClass('wq-tab-panel-active');

        // When switching to Tab 2, make sure item_type field is read-only there
        if (tab_id == 2) {
            _make_item_type_readonly_in_form(grid_row);
            // Trigger master data loading for Tab 2
            _apply_master_data_options(frm, cdt, cdn);
        }
    });

    // ── Item type select change handler ───────────────────────────────────
    $tabs.find('.wq-item-type-select').on('change', function () {
        var selected = $(this).val();
        var $next_btn = $tabs.find('.wq-next-btn');
        var $tab2_btn = $tabs.find('.wq-tab-btn[data-tab="2"]');

        if (selected) {
            $next_btn.prop('disabled', false);
            $tab2_btn.removeClass('wq-tab-disabled');
        } else {
            $next_btn.prop('disabled', true);
            $tab2_btn.addClass('wq-tab-disabled');
        }
    });

    // ── Next button handler ───────────────────────────────────────────────
    $tabs.find('.wq-next-btn').on('click', function () {
        var selected_type;
        if (has_item_type) {
            selected_type = row.item_type;
        } else {
            selected_type = $tabs.find('.wq-item-type-select').val();
        }

        if (!selected_type) {
            frappe.show_alert({
                message: 'Please select an Item Type first',
                indicator: 'orange'
            });
            return;
        }

        // Save item type to the row
        frappe.model.set_value(cdt, cdn, 'item_type', selected_type);

        // Lock the select — replace with locked badge
        $tabs.find('.wq-item-type-select-wrapper').html(
            '<div class="wq-locked-badge">' +
            '<span class="lock-icon">🔒</span> ' +
            selected_type +
            '</div>'
        );
        $tabs.find('.wq-item-type-panel p').text(
            'Item type is locked for this row. To use a different type, create a new row.'
        );
        $(this).text('Next → Item Details');

        // Update Tab 1 button to show checkmark
        var $tab1_btn = $tabs.find('.wq-tab-btn[data-tab="1"]');
        if (!$tab1_btn.find('.wq-tab-check').length) {
            $tab1_btn.append(' <span class="wq-tab-check">✓</span>');
        }

        // Switch to Tab 2
        $tabs.find('.wq-tab-btn').removeClass('wq-tab-active');
        $tabs.find('.wq-tab-panel').removeClass('wq-tab-panel-active');
        $tabs.find('.wq-tab-btn[data-tab="2"]').addClass('wq-tab-active').removeClass('wq-tab-disabled');
        $tabs.find('[data-tab-panel="2"]').addClass('wq-tab-panel-active');

        // Make item_type read-only in the actual form
        _make_item_type_readonly_in_form(grid_row);

        // Trigger master data loading for the selected item type
        _apply_master_data_options(frm, cdt, cdn);
    });

    // ── If editing existing row with item_type already set, auto-go to Tab 2 ──
    if (has_item_type) {
        // Auto-switch to Tab 2 after a brief moment for rendering
        setTimeout(function () {
            $tabs.find('.wq-tab-btn[data-tab="2"]').trigger('click');
        }, 100);
    }
}

/**
 * Make the item_type field read-only/disabled in the grid form (Tab 2).
 */
function _make_item_type_readonly_in_form(grid_row) {
    if (!grid_row || !grid_row.grid_form) return;

    var fields_dict = grid_row.grid_form.fields_dict;
    if (!fields_dict || !fields_dict.item_type) return;

    var item_type_field = fields_dict.item_type;

    // Set read_only on the df
    item_type_field.df.read_only = 1;
    item_type_field.refresh();

    // Also disable the actual input element
    var $input = item_type_field.$wrapper.find('select, input');
    $input.prop('disabled', true);
    $input.css({
        'background-color': '#f1f5f9',
        'cursor': 'not-allowed',
        'opacity': '0.7'
    });
}

// ─── Window Quotation Form ────────────────────────────────────────────────────
frappe.ui.form.on('Window Quotation', {
    refresh: function (frm) {
        // Pre-warm cache on form load so first child-row open is instant
        _fetch_master_data(function () { });
    }
});

// ─── Window Quotation Item (child table) ─────────────────────────────────────
frappe.ui.form.on('Window Quotation Item', {

    // Fires when child row dialog opens
    form_render: function (frm, cdt, cdn) {
        var grid = frm.fields_dict.items && frm.fields_dict.items.grid;
        var grid_row = grid && grid.get_row(cdn);

        if (grid_row) {
            // Build the tabbed UI — this wraps the existing form
            _build_tabbed_ui(frm, cdt, cdn, grid_row);
        }
    },

    // Fires when user changes Item Type → re-filter selects immediately
    // (This is kept for safety but in practice item_type won't change
    //  because it's locked after selection. It handles edge cases.)
    item_type: function (frm, cdt, cdn) {
        var grid = frm.fields_dict.items && frm.fields_dict.items.grid;
        var grid_row = grid && grid.get_row(cdn);

        if (_wq_master_data) {
            // Data already cached — apply immediately, no loading needed
            var dialog_fields = grid_row && grid_row.grid_form && grid_row.grid_form.fields_dict;
            if (dialog_fields) {
                _do_apply_options(frm, cdt, cdn, _wq_master_data, dialog_fields, grid_row);
                return;
            }
        }

        // Fallback: re-fetch and apply
        _apply_master_data_options(frm, cdt, cdn);
    }
});
