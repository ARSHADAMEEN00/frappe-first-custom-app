import frappe

def create_dealer_doctype():
    if not frappe.db.exists("DocType", "Dealer"):
        doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Dealer",
            "module": "Ameen App",
            "custom": 1,
            "autoname": "field:dealer_name",
            "fields": [
                {
                    "fieldname": "dealer_name",
                    "label": "Dealer Name",
                    "fieldtype": "Data",
                    "reqd": 1,
                    "unique": 1,
                    "in_list_view": 1
                },
                {
                    "fieldname": "contact_no",
                    "label": "Contact No",
                    "fieldtype": "Data",
                    "in_list_view": 1
                },
                {
                    "fieldname": "email",
                    "label": "Email",
                    "fieldtype": "Data"
                },
                {
                    "fieldname": "address",
                    "label": "Address",
                    "fieldtype": "Small Text"
                }
            ],
            "permissions": [
                {
                    "role": "System Manager",
                    "read": 1,
                    "write": 1,
                    "create": 1,
                    "delete": 1
                },
                {
                    "role": "All",
                    "read": 1,
                    "write": 1,
                    "create": 1,
                    "delete": 0
                }
            ]
        })
        doc.insert()
        
    # Now update Window Quotation dealer field
    wq = frappe.get_doc("DocType", "Window Quotation")
    for f in wq.fields:
        if f.fieldname == "dealer":
            f.fieldtype = "Link"
            f.options = "Dealer"
            f.in_list_view = 1
    wq.save()

    frappe.db.commit()

