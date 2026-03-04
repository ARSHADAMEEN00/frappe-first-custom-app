# Copyright (c) 2026, ameen and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class MasterDataItem(Document):
	def validate(self):
		self.validate_duplicate_item_name()

	def validate_duplicate_item_name(self):
		if self.item_name and self.parent:
			exists = frappe.db.exists(
				"Master Data Item",
				{
					"item_name": self.item_name,
					"parent": self.parent,
					"name": ("!=", self.name)
				}
			)
			if exists:
				frappe.throw(
					msg=f"Item Name '{self.item_name}' already exists under Master Type '{self.parent}'",
					title="Duplicate Item Name"
				)

