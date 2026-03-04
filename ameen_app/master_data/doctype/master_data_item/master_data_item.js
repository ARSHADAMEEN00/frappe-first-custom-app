frappe.ui.form.on('Master Data Item', {
    refresh(frm) {
        // Custom logic (if any)
    },
    master_type(frm) {
        if (frm.doc.master_type && !frm.doc.item_name) {
            // Optional: auto-fill helper or custom logic
        }
    }
});
