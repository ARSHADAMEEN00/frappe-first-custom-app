import json

import frappe
from frappe import _


@frappe.whitelist(allow_guest=True)
def create_service_registration(full_name=None, phone=None, email=None, dob=None, age=None, services_needed=0):
	try:
		if not full_name and frappe.form_dict.get("full_name"):
			full_name = frappe.form_dict.get("full_name")
		if not phone and frappe.form_dict.get("phone"):
			phone = frappe.form_dict.get("phone")

		if phone and not str(phone).startswith("+"):
			phone = "+91-" + str(phone)

		if not full_name or not phone:
			frappe.local.response["http_status_code"] = 400
			return {"status": "error", "message": "Full Name and Phone are required"}

		doc = frappe.get_doc(
			{
				"doctype": "Services Registration",
				"full_name": full_name,
				"phone": phone,
				"email": email,
				"dob": dob,
				"age": age,
				"services_needed": services_needed,
			}
		)
		doc.insert(ignore_permissions=True)
		frappe.db.commit()

		return {
			"status": "success",
			"message": "Registration created successfully",
			"data": {"name": doc.name},
		}
	except Exception as e:
		frappe.log_error(f"Error creating service registration: {str(e)}", "Create Service Registration API")
		frappe.local.response["http_status_code"] = 500
		return {"status": "error", "message": str(e)}


@frappe.whitelist(allow_guest=True)
def create_customer(customer_name, customer_type="Individual", customer_group="Individual"):
	"""
	Create a new Customer in ERPNext (idempotent).
	"""
	try:
		if frappe.db.exists("Customer", customer_name):
			return {
				"status": "success",
				"message": "Customer already exists",
				"data": {"name": customer_name},
			}

		customer = frappe.get_doc(
			{
				"doctype": "Customer",
				"customer_name": customer_name,
				"customer_type": customer_type,
				"customer_group": customer_group,
				"territory": "All Territories",
			}
		)

		customer.insert(ignore_permissions=True)
		frappe.db.commit()

		return {
			"status": "success",
			"message": "Customer created successfully",
			"data": {"name": customer.name},
		}
	except Exception as e:
		frappe.log_error(f"Error creating customer: {str(e)}", "Create Customer API")
		frappe.local.response["http_status_code"] = 500
		return {"status": "error", "message": str(e)}


@frappe.whitelist(allow_guest=True)
def create_sales_invoice(customer, items, posting_date=None, remarks=None):
	"""
	Create a Sales Invoice from an external source (e.g. CRM lead close).

	Args:
	    customer: Customer name or ID
	    items: List of dicts with item_code, qty, rate, description
	    posting_date: Optional posting date (defaults to today)
	    remarks: Optional remarks / reference text
	"""
	try:
		if not posting_date:
			posting_date = frappe.utils.today()

		# Allow items to be sent as JSON string
		if isinstance(items, str):
			items = json.loads(items)

		if not items:
			frappe.local.response["http_status_code"] = 400
			return {"status": "error", "message": "At least one item is required"}

		invoice = frappe.get_doc(
			{
				"doctype": "Sales Invoice",
				"customer": customer,
				"posting_date": posting_date,
				"items": items,
				"remarks": remarks,
			}
		)

		invoice.insert(ignore_permissions=True)
		invoice.submit()
		frappe.db.commit()

		return {
			"status": "success",
			"message": "Sales Invoice created successfully",
			"data": {
				"name": invoice.name,
				"grand_total": invoice.grand_total,
			},
		}
	except Exception as e:
		frappe.log_error(f"Error creating sales invoice: {str(e)}", "Create Sales Invoice API")
		frappe.local.response["http_status_code"] = 500
		return {"status": "error", "message": str(e)}


@frappe.whitelist(allow_guest=True)
def create_or_update_lead_from_crm(full_name=None, email=None, phone=None, company=None, status=None, notes=None):
	"""
	Create or Update an ERPNext Lead from the external CRM.
	"""
	try:
		# Support both explicit args (JSON body) and form_dict (URL / form posts)
		if not full_name and frappe.form_dict.get("full_name"):
			full_name = frappe.form_dict.get("full_name")
		if not email and frappe.form_dict.get("email"):
			email = frappe.form_dict.get("email")
		if not phone and frappe.form_dict.get("phone"):
			phone = frappe.form_dict.get("phone")
		if not company and frappe.form_dict.get("company"):
			company = frappe.form_dict.get("company")
		if not status and frappe.form_dict.get("status"):
			status = frappe.form_dict.get("status")
		if not notes and frappe.form_dict.get("notes"):
			notes = frappe.form_dict.get("notes")

		if not full_name:
			frappe.local.response["http_status_code"] = 400
			return {"status": "error", "message": "full_name is required"}

		existing_lead = None
		or_filters = {}
		if email:
			or_filters["email_id"] = email
		if phone:
			or_filters["mobile_no"] = phone
			
		if or_filters:
			exists = frappe.get_all("Lead", or_filters=or_filters, limit=1)
			if exists:
				existing_lead = exists[0].name

		if existing_lead:
			lead_doc = frappe.get_doc("Lead", existing_lead)
			lead_doc.lead_name = full_name
			if company:
				lead_doc.company_name = company
			if phone:
				lead_doc.mobile_no = phone
			if email:
				lead_doc.email_id = email
			if notes:
				lead_doc.append("notes", {"note": notes})
			# Map closed status to Converted if CRM sets it to Closed
			if status and status.lower() == "closed":
				lead_doc.status = "Converted"
			
			lead_doc.flags.ignore_permissions = True
			lead_doc.save(ignore_permissions=True)
		else:
			# Map closed status to Converted
			frappe_status = "Converted" if (status and status.lower() == "closed") else "Lead"
			lead_doc = frappe.get_doc(
				{
					"doctype": "Lead",
					"lead_name": full_name,
					"email_id": email,
					"mobile_no": phone,
					"company_name": company,
					"status": frappe_status,
					"notes": [{"note": notes}] if notes else [],
				}
			)
			lead_doc.flags.ignore_permissions = True
			lead_doc.insert(ignore_permissions=True)

		frappe.db.commit()

		return {
			"status": "success",
			"message": "Lead synced from CRM successfully",
			"data": {"name": lead_doc.name},
		}
	except Exception as e:
		frappe.log_error(f"Error syncing lead from CRM: {str(e)}", "CRM Lead Sync API")
		frappe.local.response["http_status_code"] = 500
		return {"status": "error", "message": str(e)}


def _ensure_item_exists(item_code, description=None):
	"""
	Ensure an Item exists with the given item_code.
	If not found, create a simple non-stock Item.
	"""
	if not item_code:
		item_code = "CRM-SERVICE"

	if frappe.db.exists("Item", item_code):
		return item_code

	item = frappe.get_doc(
		{
			"doctype": "Item",
			"item_code": item_code,
			"item_name": item_code,
			"item_group": "Products",
			"stock_uom": "Nos",
			"standard_rate": 0,
			"is_stock_item": 0,
			"description": description,
		}
	)

	item.insert(ignore_permissions=True)
	frappe.db.commit()
	return item.name


@frappe.whitelist(allow_guest=True)
def create_sales_order(customer, items, transaction_date=None, delivery_date=None, remarks=None):
	"""
	Create a Sales Order (instead of invoice) for a closed CRM lead.
	"""
	try:
		if not transaction_date:
			transaction_date = frappe.utils.today()

		if isinstance(items, str):
			items = json.loads(items)

		if not items:
			frappe.local.response["http_status_code"] = 400
			return {"status": "error", "message": "At least one item is required"}

		# Normalise items and auto-create missing item codes
		normalized_items = []
		for row in items:
			row_dict = dict(row)
			item_code = row_dict.get("item_code")
			item_code = _ensure_item_exists(item_code, row_dict.get("description"))
			row_dict["item_code"] = item_code
			normalized_items.append(row_dict)

		order = frappe.get_doc(
			{
				"doctype": "Sales Order",
				"customer": customer,
				"transaction_date": transaction_date,
				"delivery_date": delivery_date or transaction_date,
				"items": normalized_items,
				"remarks": remarks,
			}
		)

		order.insert(ignore_permissions=True)
		order.submit()
		frappe.db.commit()

		return {
			"status": "success",
			"message": "Sales Order created successfully",
			"data": {"name": order.name, "grand_total": order.grand_total},
		}
	except Exception as e:
		frappe.log_error(f"Error creating sales order: {str(e)}", "Create Sales Order API")
		frappe.local.response["http_status_code"] = 500
		return {"status": "error", "message": str(e)}


# ─────────────────────────────────────────────
# Steel-Window Quotation Module
# ─────────────────────────────────────────────

@frappe.whitelist(allow_guest=False)
def create_window_quotation(
	customer,
	dealer=None,
	note=None,
	order_type="Regular",
	items_json="[]",
	transaction_date=None,
):
	"""
	Create a Window Quotation document.

	Args:
	    customer        : Link to ERPNext Customer (required)
	    dealer          : Free-text dealer name
	    note            : Optional note / remarks
	    order_type      : "Regular" or "Customized"
	    items_json      : JSON-serialised list of item dicts matching
	                      the Window Quotation Item child fields
	    transaction_date: Defaults to today
	Returns:
	    {status, data: {name, grand_total, total_qty}}
	"""
	try:
		if not customer:
			frappe.local.response["http_status_code"] = 400
			return {"status": "error", "message": "customer is required"}

		if not transaction_date:
			transaction_date = frappe.utils.today()

		if isinstance(items_json, str):
			items_json = json.loads(items_json)

		items = []
		for idx, row in enumerate(items_json, start=1):
			row = dict(row)
			row["item_no"] = idx
			qty  = float(row.get("qty")  or 1)
			rate = float(row.get("rate") or 0)
			row["amount"] = qty * rate
			items.append(row)

		doc = frappe.get_doc(
			{
				"doctype": "Window Quotation",
				"customer": customer,
				"dealer": dealer,
				"note": note,
				"order_type": order_type,
				"transaction_date": transaction_date,
				"status": "Draft",
				"items": items,
			}
		)
		doc.insert(ignore_permissions=True)
		frappe.db.commit()

		return {
			"status": "success",
			"message": "Window Quotation created successfully",
			"data": {
				"name": doc.name,
				"grand_total": doc.grand_total,
				"total_qty": doc.total_qty,
			},
		}
	except Exception as e:
		frappe.log_error(
			f"Error creating window quotation: {str(e)}", "Window Quotation API"
		)
		frappe.local.response["http_status_code"] = 500
		return {"status": "error", "message": str(e)}


@frappe.whitelist(allow_guest=False)
def get_window_quotations(limit=20, customer=None, status=None):
	"""
	Return a list of Window Quotation records for dashboard display.

	Args:
	    limit    : Maximum number of records to return (default 20)
	    customer : Optional – filter by customer name
	    status   : Optional – filter by status (Draft / Submitted / Cancelled)
	Returns:
	    {status, data: [...]}
	"""
	try:
		filters = {}
		if customer:
			filters["customer"] = customer
		if status:
			filters["status"] = status

		quotations = frappe.get_all(
			"Window Quotation",
			filters=filters,
			fields=[
				"name",
				"customer",
				"dealer",
				"transaction_date",
				"order_type",
				"total_qty",
				"grand_total",
				"status",
			],
			order_by="creation desc",
			limit_page_length=int(limit),
		)

		return {"status": "success", "data": quotations}
	except Exception as e:
		frappe.log_error(
			f"Error fetching window quotations: {str(e)}", "Window Quotation List API"
		)
		frappe.local.response["http_status_code"] = 500
		return {"status": "error", "message": str(e)}


def set_user_password(user, password):
	"""Utility: set a user's password. Call via bench execute."""
	from frappe.utils.password import update_password
	update_password(user, password)
	frappe.db.commit()
	print(f"Password updated for {user}")


def check_login_test(user, password):
	"""Debug: test auth for a user. Call via bench execute."""
	from frappe.utils.password import check_password
	from frappe.query_builder import Table
	Auth = Table("__Auth")
	rows = (
		frappe.qb.from_(Auth)
		.select(Auth.name, Auth.password, Auth.encrypted, Auth.fieldname)
		.where(Auth.name == user)
		.run(as_dict=True)
	)
	print(f"Auth rows for {user}: {rows}")
	try:
		result = check_password(user, password)
		print(f"check_password succeeded: {result}")
	except Exception as e:
		print(f"check_password FAILED: {e}")
