import frappe
import traceback

def run():
    try:
        exists = frappe.get_all("Lead", limit=1)
        if exists:
            lead_doc = frappe.get_doc("Lead", exists[0].name)
            lead_doc.notes = "test"
            lead_doc.save(ignore_permissions=True)
            print("Successfully updated an existing lead!")
            return {"status": "success"}
        else:
            print("No lead found")
    except Exception as e:
        print("Traceback:", traceback.format_exc())
