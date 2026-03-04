"""
Import masterdata2.json into Frappe Master Data Type + Master Data Item.
Run with:
  bench --site ameenSite execute ameen_app.import_master_data.run
"""

import json
import frappe

# ─── Map old order_item_type values to the canonical names used in Frappe ─────
ITEM_TYPE_MAP = {
    "window":               "Window",
    "Window":               "Window",
    "door":                 "Door",
    "Door":                 "Door",
    "Door Frame":           "Door Frame",
    "door frame":           "Door Frame",
    "Mesh Window":          "Mesh Window",
    "meshwindow":           "Mesh Window",
    "Grill Window":         "Grill Window",
    "grillwindow":          "Grill Window",
    "Ventilator Window":    "Ventilator Window",
    "Fully Finished Window":"Fully Finished Window",
    "Fully Finished Door":  "Fully Finished Door",
    "Door Cum Window":      "Door Cum Window",
}

# ─── Master Data Types to create (from masterdataitemtype records) ────────────
MASTER_DATA_TYPES = [
    # (title, is_active)
    # Extracted from the JSON — only meaningful/real types (not UUID-named or test ones)
    "Channel Size",
    "Fixing Type",
    "Grill Type",
    "Manchary",
    "Hinge Type",
    "Lock Type",
    "Handle Type",
    "Bolting Type",
    "Door Sill Type",
    "Door Sill",
    "Mesh Type",
    "Mesh Window Type",
    "Mesh Window Lock",
    "Mesh Hinge Type",
    "Mesh Hinges",
    "Mesh Lock",
    "Louver Type",
    "Window Louver Type",
    "Window Panel Type",
    "Window Pane Type",
    "Window Pane Design",
    "Color Code",
    "Color Type",
    "Out Fan Type",
    "Double Door Type",
    "Door Design",
    "Door Lock",
    "Column Connection Hinge",
    "Design",
    "Pane Type",
]

# ─── Items from masterdataitem records ───────────────────────────────────────
# We extract only records from `master_data.masterdataitem` with a real
# (non-UUID) master_data_item_type and is_active=True/is_deleted=False
RAW_ITEMS = [
    {"title": "Square tube MS",        "order_item_type": "Window",              "master_data_item_type": "Grill Type",          "brand": "Tata",        "gauge": "16"},
    {"title": "Arch LH001",            "order_item_type": "Window",              "master_data_item_type": "Window Pane Design",  "brand": None,          "gauge": None},
    {"title": "Arch LH026",            "order_item_type": "Window",              "master_data_item_type": "Window Pane Design",  "brand": None,          "gauge": None},
    {"title": "Arch LH010",            "order_item_type": "Window",              "master_data_item_type": "Window Pane Design",  "brand": None,          "gauge": None},
    {"title": "2x4 16g",               "order_item_type": "Door Frame",          "master_data_item_type": "Channel Size",        "brand": "TATA Steels", "gauge": "16"},
    {"title": "GI sill",               "order_item_type": "Door Frame",          "master_data_item_type": "Door Sill",           "brand": None,          "gauge": None},
    {"title": "3mm SS",                "order_item_type": "Mesh Window",         "master_data_item_type": "Mesh Type",           "brand": None,          "gauge": "123"},
    {"title": "3 inch manchary",       "order_item_type": "Window",              "master_data_item_type": "Manchary",            "brand": None,          "gauge": None},
    {"title": "Classic",               "order_item_type": "Door",                "master_data_item_type": "Double Door Type",    "brand": None,          "gauge": None},
    {"title": "Normal",                "order_item_type": "Mesh Window",         "master_data_item_type": "Mesh Lock",           "brand": None,          "gauge": None},
    {"title": "Wood finish",           "order_item_type": "Fully Finished Window","master_data_item_type": "Color Type",         "brand": None,          "gauge": None},
    {"title": "Normal type",           "order_item_type": "Ventilator Window",   "master_data_item_type": "Out Fan Type",        "brand": None,          "gauge": None},
    {"title": "SS 4 inch",             "order_item_type": "Door",                "master_data_item_type": "Hinge Type",          "brand": None,          "gauge": None},
    {"title": "Luxury",                "order_item_type": "Door",                "master_data_item_type": "Handle Type",         "brand": None,          "gauge": None},
    {"title": "Normal",                "order_item_type": "Mesh Window",         "master_data_item_type": "Mesh Hinges",         "brand": "64",          "gauge": "24"},
    {"title": "2x4 16g",               "order_item_type": "Window",              "master_data_item_type": "Channel Size",        "brand": "TATA Steels", "gauge": "16"},
    {"title": "4 Inch Manchari",       "order_item_type": "Door Frame",          "master_data_item_type": "Manchary",            "brand": None,          "gauge": None},
    {"title": "Round Tube",            "order_item_type": "Window",              "master_data_item_type": "Grill Type",          "brand": None,          "gauge": "16"},
    {"title": "5 inch manchary",       "order_item_type": "Door Cum Window",     "master_data_item_type": "Manchary",            "brand": None,          "gauge": None},
    {"title": "normal",                "order_item_type": "Door",                "master_data_item_type": "Channel Size",        "brand": "TATA Steels", "gauge": "18"},
    {"title": "Aluminium Mesh",        "order_item_type": "Mesh Window",         "master_data_item_type": "Mesh Window Type",    "brand": None,          "gauge": None},
    {"title": "Spanish louver",        "order_item_type": "Window",              "master_data_item_type": "Window Louver Type",  "brand": None,          "gauge": None},
    {"title": "Patta Rod MS",          "order_item_type": "Window",              "master_data_item_type": "Grill Type",          "brand": "Tata",        "gauge": "16"},
    {"title": "2x3x6",                 "order_item_type": "Fully Finished Window","master_data_item_type": "Channel Size",       "brand": "TATA Steels", "gauge": "16"},
    {"title": "6 inch manchary",       "order_item_type": "Door Cum Window",     "master_data_item_type": "Manchary",            "brand": None,          "gauge": None},
    {"title": "Classic",               "order_item_type": "Door Cum Window",     "master_data_item_type": "Double Door Type",    "brand": None,          "gauge": None},
    {"title": "Square tube grill",     "order_item_type": "Fully Finished Window","master_data_item_type": "Grill Type",         "brand": "Tata",        "gauge": "16"},
    {"title": "Normal",                "order_item_type": "Mesh Window",         "master_data_item_type": "Fixing Type",         "brand": None,          "gauge": None},
    {"title": "3x5 16g",               "order_item_type": "Window",              "master_data_item_type": "Channel Size",        "brand": "TATA Steels", "gauge": "16"},
    {"title": "Normal lock",           "order_item_type": "Grill Window",        "master_data_item_type": "Grill Window Lock Type","brand": None,        "gauge": None},
    {"title": "Metal lock",            "order_item_type": "Grill Window",        "master_data_item_type": "Lock Type",           "brand": "tata",        "gauge": None},
    {"title": "Square tube grill",     "order_item_type": "Grill Window",        "master_data_item_type": "Grill Type",          "brand": "Tata",        "gauge": "16"},
    {"title": "Diamond Tube SS",       "order_item_type": "Window",              "master_data_item_type": "Grill Type",          "brand": None,          "gauge": "16"},
    {"title": "German Type",           "order_item_type": "Window",              "master_data_item_type": "Window Pane Type",    "brand": "Tata",        "gauge": "16"},
    {"title": "SS sill",               "order_item_type": "Door Cum Window",     "master_data_item_type": "Door Sill",           "brand": None,          "gauge": None},
    {"title": "Metal Hinges",          "order_item_type": "Mesh Window",         "master_data_item_type": "Mesh Hinge Type",     "brand": None,          "gauge": None},
    {"title": "110-Degree Full Overlay","order_item_type": "Grill Window",       "master_data_item_type": "Column Connection Hinge","brand": None,       "gauge": None},
    {"title": "GI sill",               "order_item_type": "Door Cum Window",     "master_data_item_type": "Door Sill",           "brand": None,          "gauge": None},
    {"title": "SS sill",               "order_item_type": "Door Frame",          "master_data_item_type": "Door Sill",           "brand": None,          "gauge": None},
    {"title": "2x5 16g",               "order_item_type": "Mesh Window",         "master_data_item_type": "Channel Size",        "brand": "TATA Steels", "gauge": "16"},
    {"title": "Normal square tube",    "order_item_type": "Mesh Window",         "master_data_item_type": "Grill Type",          "brand": "Tata",        "gauge": "16"},
    {"title": "SS 4 inch",             "order_item_type": "Window",              "master_data_item_type": "Hinge Type",          "brand": None,          "gauge": None},
    {"title": "Arc LH005",             "order_item_type": "Window",              "master_data_item_type": "Window Pane Design",  "brand": None,          "gauge": None},
    {"title": "Premium design",        "order_item_type": "Door",                "master_data_item_type": "Door Design",         "brand": None,          "gauge": "16"},
    {"title": "Arch LH018",            "order_item_type": "Window",              "master_data_item_type": "Window Pane Design",  "brand": None,          "gauge": None},
    {"title": "Modern",                "order_item_type": "Door",                "master_data_item_type": "Bolting Type",        "brand": None,          "gauge": None},
    {"title": "With Bolt",             "order_item_type": "Door",                "master_data_item_type": "Fixing Type",         "brand": None,          "gauge": None},
    {"title": "Classic lock",          "order_item_type": "Door",                "master_data_item_type": "Door Lock",           "brand": "auto",        "gauge": None},
    {"title": "SS handle",             "order_item_type": "Door",                "master_data_item_type": "Handle Type",         "brand": None,          "gauge": None},
    {"title": "RAL",                   "order_item_type": "Fully Finished Door", "master_data_item_type": "Color Type",          "brand": None,          "gauge": None},
    {"title": "SS 4inch",              "order_item_type": "Mesh Window",         "master_data_item_type": "Hinge Type",          "brand": None,          "gauge": None},
    {"title": "#00000 Black",          "order_item_type": "Fully Finished Window","master_data_item_type": "Color Code",         "brand": None,          "gauge": None},
    {"title": "Fingerprint",           "order_item_type": "Door",                "master_data_item_type": "Door Lock",           "brand": "auto",        "gauge": None},
    {"title": "Plastic Hinges",        "order_item_type": "Mesh Window",         "master_data_item_type": "Mesh Hinge Type",     "brand": None,          "gauge": None},
    {"title": "Silver Casement",       "order_item_type": "Grill Window",        "master_data_item_type": "Column Connection Hinge","brand": None,       "gauge": None},
    {"title": "Normal mesh",           "order_item_type": "Mesh Window",         "master_data_item_type": "Mesh Window Type",    "brand": None,          "gauge": None},
    {"title": "Plastic",               "order_item_type": "Mesh Window",         "master_data_item_type": "Mesh Window Lock",    "brand": None,          "gauge": None},
    {"title": "GI 3 inch",             "order_item_type": "Window",              "master_data_item_type": "Hinge Type",          "brand": None,          "gauge": None},
    {"title": "Normal",                "order_item_type": "Door",                "master_data_item_type": "Bolting Type",        "brand": None,          "gauge": None},
    {"title": "SS 4inch",              "order_item_type": "Mesh Window",         "master_data_item_type": "Hinge Type",          "brand": None,          "gauge": None},
    {"title": "Traditional",           "order_item_type": "Door",                "master_data_item_type": "Fixing Type",         "brand": None,          "gauge": None},
    {"title": "With Bolt",             "order_item_type": "Window",              "master_data_item_type": "Fixing Type",         "brand": None,          "gauge": None},
    {"title": "Arch LH002",            "order_item_type": "Window",              "master_data_item_type": "Window Pane Design",  "brand": None,          "gauge": None},
    {"title": "Wooden",                "order_item_type": "Mesh Window",         "master_data_item_type": "Pane Type",           "brand": None,          "gauge": None},
    {"title": "Aluminium Alloy",       "order_item_type": "Mesh Window",         "master_data_item_type": "Mesh Window Lock",    "brand": None,          "gauge": None},
    {"title": "Round hole ss",         "order_item_type": "Mesh Window",         "master_data_item_type": "Mesh Type",           "brand": None,          "gauge": "123"},
    {"title": "Wooden design",         "order_item_type": "Door",                "master_data_item_type": "Door Design",         "brand": None,          "gauge": "16"},
    {"title": "Traditional",           "order_item_type": "Window",              "master_data_item_type": "Fixing Type",         "brand": None,          "gauge": None},
    {"title": "Plastic covered",       "order_item_type": "Grill Window",        "master_data_item_type": "Lock Type",           "brand": "tata",        "gauge": None},
    {"title": "Sqaure tube grill",     "order_item_type": "Ventilator Window",   "master_data_item_type": "Grill Type",          "brand": "Tata",        "gauge": "16"},
    {"title": "Normal",                "order_item_type": "Window",              "master_data_item_type": "Channel Size",        "brand": "TATA Steels", "gauge": "18"},
    {"title": "Fixed blade",           "order_item_type": "Window",              "master_data_item_type": "Window Louver Type",  "brand": None,          "gauge": None},
    {"title": "2x5 16g",              "order_item_type": "Fully Finished Window","master_data_item_type": "Channel Size",        "brand": "TATA Steels", "gauge": "16"},
]


def run():
    frappe.set_user("Administrator")
    created_types = 0
    created_items = 0
    skipped_items = 0

    # ── Step 1: Create Master Data Types ──────────────────────────────────────
    print("\n=== Creating Master Data Types ===")
    for type_name in MASTER_DATA_TYPES:
        if frappe.db.exists("Master Data Type", type_name):
            print(f"  ⏭  Already exists: {type_name}")
            continue
        doc = frappe.new_doc("Master Data Type")
        doc.master_name = type_name
        doc.is_active = 1
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
        created_types += 1
        print(f"  ✅ Created type: {type_name}")

    # ── Step 2: Create Master Data Items ─────────────────────────────────────
    print("\n=== Creating Master Data Items ===")
    for item in RAW_ITEMS:
        type_name    = item["master_data_item_type"]
        item_name    = item["title"]
        raw_type     = item["order_item_type"]
        item_type    = ITEM_TYPE_MAP.get(raw_type, raw_type)  # normalize
        brand        = item.get("brand") or ""
        gauge        = item.get("gauge") or ""

        # Skip if the parent type doesn't exist
        if not frappe.db.exists("Master Data Type", type_name):
            print(f"  ⚠️  Skipping '{item_name}' — type '{type_name}' not found")
            skipped_items += 1
            continue

        # Get or reload the parent doc
        parent = frappe.get_doc("Master Data Type", type_name)

        # Check for duplicates in the child table
        already_exists = any(
            r.item_name == item_name and r.item_type == item_type
            for r in parent.items
        )
        if already_exists:
            print(f"  ⏭  Duplicate skipped: [{type_name}] {item_name} ({item_type})")
            skipped_items += 1
            continue

        parent.append("items", {
            "item_name":  item_name,
            "item_type":  item_type,
            "brand":      brand,
            "gauge":      gauge,
            "is_active":  1,
        })
        parent.save(ignore_permissions=True)
        frappe.db.commit()
        created_items += 1
        print(f"  ✅ Added item: [{type_name}] {item_name} ({item_type})")

    print(f"\n{'='*50}")
    print(f"✅ Done!")
    print(f"   Master Data Types created : {created_types}")
    print(f"   Master Data Items created  : {created_items}")
    print(f"   Items skipped (dup/missing): {skipped_items}")
    print(f"{'='*50}\n")
