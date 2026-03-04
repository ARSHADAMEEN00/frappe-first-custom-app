import frappe

@frappe.whitelist()
def get_master_data():
    """
    Returns a dictionary of Master Data Types and their active items.
    """
    types = frappe.get_all("Master Data Type", filters={"is_active": 1}, fields=["name"])
    data = {}
    for t in types:
        items = frappe.get_all(
            "Master Data Item",
            filters={"parent": t.name, "is_active": 1},
            fields=["item_name", "item_code", "item_type", "brand", "gauge"]
        )
        data[t.name] = items
    return data
