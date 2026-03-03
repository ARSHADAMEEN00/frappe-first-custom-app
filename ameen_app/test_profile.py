import frappe
def execute():
    profiles = frappe.get_all("POS Profile", fields=["name", "company", "disabled"])
    print("Profiles:", profiles)
    for p in profiles:
        doc = frappe.get_doc("POS Profile", p.name)
        print("Profile:", p.name, "Users:", [u.user for u in doc.applicable_for_users], "Status:", "disabled" if doc.disabled else "enabled")
        
        has_admin = False
        for u in doc.applicable_for_users:
            if u.user == "Administrator":
                has_admin = True
                
        if not has_admin and len(doc.applicable_for_users) >= 0:
            doc.append("applicable_for_users", {"user": "Administrator", "default": 1})
            doc.save(ignore_permissions=True)
            frappe.db.commit()
            print("Added Administrator to", p.name)
