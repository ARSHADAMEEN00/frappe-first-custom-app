import frappe

def create_module():
    if not frappe.db.exists("Module Def", "Master Data"):
        frappe.get_doc({
            "doctype": "Module Def",
            "module_name": "Master Data",
            "app_name": "ameen_app"
        }).insert(ignore_permissions=True)
        frappe.db.commit()
    print("Module Master Data configured.")

def create_master_data_type():
    if not frappe.db.exists("DocType", "Master Data Type"):
        doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Master Data Type",
            "module": "Master Data",
            "custom": 0,
            "istable": 0,
            "track_changes": 1,
            "autoname": "field:master_name",
            "fields": [
                {"fieldname": "master_name", "label": "Master Name", "fieldtype": "Data", "reqd": 1, "unique": 1},
                {"fieldname": "description", "label": "Description", "fieldtype": "Small Text"},
                {"fieldname": "is_active", "label": "Is Active", "fieldtype": "Check", "default": "1"}
            ],
            "permissions": [
                {"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
                {"role": "All", "read": 1}
            ]
        })
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
        print("Master Data Type created.")
    else:
        print("Master Data Type already exists.")

def create_master_data_item():
    if not frappe.db.exists("DocType", "Master Data Item"):
        doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Master Data Item",
            "module": "Master Data",
            "custom": 0,
            "istable": 0,
            "track_changes": 1,
            "autoname": "naming_series:",
            "fields": [
                {"fieldname": "naming_series", "label": "Naming Series", "fieldtype": "Select", "options": "MDI-.#####", "default": "MDI-.#####", "hidden": 1},
                {"fieldname": "master_type", "label": "Master Type", "fieldtype": "Link", "options": "Master Data Type", "reqd": 1, "search_index": 1, "in_list_view": 1, "in_standard_filter": 1},
                {"fieldname": "item_code", "label": "Item Code", "fieldtype": "Data", "in_list_view": 1},
                {"fieldname": "item_name", "label": "Item Name", "fieldtype": "Data", "reqd": 1, "in_list_view": 1},
                {"fieldname": "item_type", "label": "Item Type", "fieldtype": "Data", "in_list_view": 1},
                {"fieldname": "gauge", "label": "Gauge", "fieldtype": "Data"},
                {"fieldname": "brand", "label": "Brand", "fieldtype": "Small Text", "in_list_view": 1},
                {"fieldname": "is_active", "label": "Is Active", "fieldtype": "Check", "default": "1", "in_list_view": 1}
            ],
            "permissions": [
                {"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
                {"role": "All", "read": 1}
            ]
        })
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
        print("Master Data Item created.")
    else:
        print("Master Data Item already exists.")

def run():
    create_module()
    create_master_data_type()
    create_master_data_item()
