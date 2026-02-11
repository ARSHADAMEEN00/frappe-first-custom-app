// Copyright (c) 2026, ameen and contributors
// For license information, please see license.txt

frappe.ui.form.on("Services Registration", {

    dob: function (frm) {
        if (frm.doc.dob) {
            var dob = new Date(frm.doc.dob);
            var today = new Date();
            var age = today.getFullYear() - dob.getFullYear();
            var m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            frm.set_value("age", age);
        }
    },

    // refresh(frm) {
    //     // frappe.msgprint("Hello World");
    //     // frappe.throw("Hello World Errored");
    //     frm.set_intro('i am ameen, you must fill all the fields')
    //     if (frm.is_new()) {
    //         frm.set_intro('form submitted successfully')
    //     }
    // },
    // onload(frm) {
    //     frappe.msgprint("Hello World");
    //     // frappe.throw("Hello World Errored");
    // },
    // validate(frm) {
    //     frappe.msgprint("Hello World");
    //     // frappe.throw("Hello World Errored");
    // },
    // before_save(frm) {
    //     frappe.msgprint("Hello World");
    //     // frappe.throw("Hello World Errored");
    // },
    // before_submit(frm) {
    //     frappe.msgprint("Hello World");
    //     // frappe.throw("Hello World Errored");
    // },
    // before_cancel(frm) {
    //     frappe.msgprint("Hello World");
    //     // frappe.throw("Hello World Errored");
    // },
    // before_delete(frm) {
    //     frappe.msgprint("Hello World");
    //     // frappe.throw("Hello World Errored");
    // },
    // services_needed: function (frm) { // check box checked
    //     if (frm.doc.services_needed) {
    //         frm.set_value("services_needed", "");
    //         frappe.throw("Please select services");
    //     }
    // },
    // age: function (frm) { // age validation
    //     if (frm.doc.age < 18) {
    //         frappe.throw("Age must be greater than 18");
    //     }
    // },
    // services_on_form_render: function (frm) { // services validation
    //     frappe.throw("Please select services");
    // },
});


frappe.ui.form.on("Services Document", {
    title: function (frm) {
        frappe.msgprint("Hello World");
        // frappe.throw("Hello World Errored");

    },
    // onload(frm) {
    //     frappe.msgprint("Hello World");
    //     // frappe.throw("Hello World Errored");
    // },
    // validate(frm) {
    //     frappe.msgprint("Hello World");
    //     // frappe.throw("Hello World Errored");
    // },
    // before_save(frm) {
    //     frappe.msgprint("Hello World");
    //     // frappe.throw("Hello World Errored");
    // },
    // before_submit(frm) {
    //     frappe.msgprint("Hello World");
    //     // frappe.throw("Hello World Errored");
    // },
    // before_cancel(frm) {
    //     frappe.msgprint("Hello World");
    //     // frappe.throw("Hello World Errored");
    // },
    // before_delete(frm) {
    //     frappe.msgprint("Hello World");
    //     // frappe.throw("Hello World Errored");
    // },
    // services_needed: function (frm) { // check box checked
    //     if (frm.doc.services_needed) {
    //         frm.set_value("services_needed", "");
    //         frappe.throw("Please select services");
    //     }
    // },
    // age: function (frm) { // age validation
    //     if (frm.doc.age < 18) {
    //         frappe.throw("Age must be greater than 18");
    //     }
    // },
    // services_on_form_render: function (frm) { // services validation
    //     frappe.throw("Please select services");
    // },
});