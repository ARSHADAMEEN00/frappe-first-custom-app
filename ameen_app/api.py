import frappe
from frappe import _

@frappe.whitelist(allow_guest=True)
@frappe.whitelist(allow_guest=True)
def create_service_registration(full_name=None, phone=None, email=None, dob=None, age=None, services_needed=0):
    try:
        if not full_name and frappe.form_dict.get('full_name'):
             full_name = frappe.form_dict.get('full_name')
        if not phone and frappe.form_dict.get('phone'):
             phone = frappe.form_dict.get('phone')

        if phone and not phone.startswith("+"):
            phone = "+91-" + phone

        if not full_name or not phone:
             frappe.response["status_code"] = 400
             return {"status": "error", "message": "Full Name and Phone are required"}

        doc = frappe.get_doc({
            "doctype": "Services Registration",
            "full_name": full_name,
            "phone": phone,
            "email": email,
            "dob": dob,
            "age": age,
            "services_needed": services_needed
        })
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
        
        return {"status": "success", "message": "Registration created successfully", "data": {"name": doc.name}}
    except Exception as e:
        frappe.log_error(f"Error creating service registration: {str(e)}", "Create Service Registration API")
        frappe.response["status_code"] = 500
        return {"status": "error", "message": str(e)}
