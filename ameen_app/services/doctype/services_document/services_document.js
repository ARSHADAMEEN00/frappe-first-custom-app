// Copyright (c) 2026, ameen and contributors
// For license information, please see license.txt

frappe.ui.form.on("Services Document", {
    billing_type: function (frm) {
        if (frm.doc.billing_type === "One Time") {
            frm.set_value("base_price", 120000);
        } else if (frm.doc.billing_type === "Monthly") {
            frm.set_value("base_price", 120000 / 24);
        } else if (frm.doc.billing_type === "Yearly") {
            frm.set_value("base_price", 120000 / 2);
        }
    }
});
