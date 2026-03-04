# Copyright (c) 2026, ameen and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class MasterDataType(Document):
	def validate(self):
		self.items_count = len(self.items) if self.items else 0
