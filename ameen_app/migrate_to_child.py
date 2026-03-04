import frappe

def run():
    # Move relationships to standard child table columns BEFORE changing DocType
    try:
        frappe.db.sql("""
            UPDATE `tabMaster Data Item` 
            SET parent = master_type, parenttype='Master Data Type', parentfield='items'
            WHERE parent IS NULL OR parent = ''
        """)
        print("Updated records.")
    except Exception as e:
        print("SQL Update Error:", e)

    # 1. Update Master Data Item to be a Child Table
    item_dt = frappe.get_doc("DocType", "Master Data Item")
    item_dt.istable = 1
    item_dt.autoname = ""
    original_len = len(item_dt.fields)
    item_dt.fields = [f for f in item_dt.fields if f.fieldname not in ("naming_series", "master_type")]
    item_dt.permissions = []  # Child tables don't need permissions
    item_dt.save(ignore_permissions=True)
    print("Master Data Item saved.")

    # 2. Add Table field to Master Data Type
    type_dt = frappe.get_doc("DocType", "Master Data Type")
    if not any(f.fieldname == "items" for f in type_dt.fields):
        type_dt.append("fields", {
            "fieldname": "items",
            "fieldtype": "Table",
            "label": "Items",
            "options": "Master Data Item"
        })
        type_dt.save(ignore_permissions=True)
        print("Master Data Type saved.")

    frappe.db.commit()

run()
