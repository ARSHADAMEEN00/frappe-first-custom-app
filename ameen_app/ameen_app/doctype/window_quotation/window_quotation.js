// Copyright (c) 2026, ameen and contributors
// For license information, please see license.txt

// ─── Master Data Cache ────────────────────────────────────────────────────────
var _wq_master_data = null;

function _fetch_master_data(callback) {
    if (_wq_master_data) {
        callback(_wq_master_data);
        return;
    }
    frappe.call({
        method: 'ameen_app.master_data.api.get_master_data',
        callback: function (r) {
            _wq_master_data = r.message || {};
            callback(_wq_master_data);
        }
    });
}

/**
 * Converts a Master Data Type name to a snake_case fieldname.
 * "Channel Size" → "channel_size"
 */
function _to_fieldname(type_name) {
    return type_name.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Apply dynamic Select dropdowns to an open child row DIALOG form.
 * 
 * When you click the pencil ✏️ on a child row, Frappe opens a dialog.
 * The fields in that dialog live in:
 *   grid_row.grid_form.fields_dict[fieldname]
 * NOT in grid_row.on_grid_fields_dict (those are the inline table columns).
 */
function _apply_master_data_options(frm, cdt, cdn) {
    _fetch_master_data(function (master_data) {
        var row = locals[cdt][cdn];
        if (!row) return;

        var item_type = row.item_type || 'Window';

        // Get the grid
        var grid = frm.fields_dict.items && frm.fields_dict.items.grid;
        if (!grid) return;

        // Get the open grid row object
        var grid_row = grid.get_row(cdn);
        if (!grid_row) return;

        // ── The dialog form fields are in grid_row.grid_form.fields_dict ──
        var dialog_fields = grid_row.grid_form && grid_row.grid_form.fields_dict;
        if (!dialog_fields) return;

        Object.keys(master_data).forEach(function (type_name) {
            var fieldname = _to_fieldname(type_name);
            var items = master_data[type_name];

            // Check field exists in the dialog
            var field_widget = dialog_fields[fieldname];
            if (!field_widget) return;

            // Filter items to match the selected item_type
            // Items with NO item_type set apply to all types
            var valid = items.filter(function (it) {
                return !it.item_type || it.item_type === item_type;
            });

            // Build newline-separated options (blank first = optional)
            var options = '\n' + valid.map(function (it) { return it.item_name; }).join('\n');

            // Patch the field definition to Select and refresh the widget
            field_widget.df.fieldtype = 'Select';
            field_widget.df.options = options;
            field_widget.refresh();

            // If the current value is no longer valid for this item_type, clear it
            if (row[fieldname] && !valid.find(function (it) {
                return it.item_name === row[fieldname];
            })) {
                frappe.model.set_value(cdt, cdn, fieldname, '');
            }
        });
    });
}

// ─── Window Quotation Form ────────────────────────────────────────────────────
frappe.ui.form.on('Window Quotation', {
    refresh: function (frm) {
        // Pre-warm the master data cache when the form loads
        _fetch_master_data(function () { });
    }
});

// ─── Window Quotation Item (child table) ─────────────────────────────────────
frappe.ui.form.on('Window Quotation Item', {

    // Fired when a child row dialog opens — convert fields to Select dropdowns
    form_render: function (frm, cdt, cdn) {
        // Small delay to ensure grid_form is fully rendered before we patch it
        setTimeout(function () {
            _apply_master_data_options(frm, cdt, cdn);
        }, 100);
    },

    // Fired when user changes Item Type — re-filter all master data dropdowns
    item_type: function (frm, cdt, cdn) {
        setTimeout(function () {
            _apply_master_data_options(frm, cdt, cdn);
        }, 50);
    }
});
