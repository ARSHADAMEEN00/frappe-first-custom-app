# Copyright (c) 2026, ameen and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class WindowQuotation(Document):
	def before_save(self):
		"""Compute total_qty and grand_total from child rows."""
		total_qty = 0
		grand_total = 0.0
		for idx, item in enumerate(self.items or [], start=1):
			item.item_no = idx
			qty = item.qty or 0
			rate = item.rate or 0.0
			item.amount = qty * rate
			total_qty += qty
			grand_total += item.amount
		self.total_qty = total_qty
		self.grand_total = grand_total
