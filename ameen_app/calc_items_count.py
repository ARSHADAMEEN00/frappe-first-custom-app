import frappe

def run():
    types = frappe.get_all("Master Data Type")
    for t in types:
        doc = frappe.get_doc("Master Data Type", t.name)
        doc.items_count = len(doc.items) if doc.items else 0
        doc.save(ignore_permissions=True)
    frappe.db.commit()
    print("Items count calculated and updated successfully for existing data.")
