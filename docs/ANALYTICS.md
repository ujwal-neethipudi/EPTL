# GA4 events and parameters (EPTL map)

This document lists every custom event and its parameters sent to GA4. Use it to configure **Custom dimensions** so parameter values (e.g. category names) appear in standard reports, not only in Realtime.

## Why category names show in Realtime but not in Reports

GA4 shows **event parameters in Realtime** automatically. For **standard reports and Explorations**, any parameter you want as a breakdown (e.g. category name, company name) must be registered as an **event-scoped Custom dimension**. If you already see `company_name` in reports, that dimension is likely created; add the same for `category_name` and `subcategory_name` (and others below as needed).

## Event and parameter reference (exact names for GA4)

| Event name | Parameters (exact names) |
|------------|---------------------------|
| `pdf_download` | `file_name`, `source`, `transport_type` |
| `view_company_card` | `company_name` |
| `close_company_card` | `company_name` |
| `logo_click` | `company_name`, `transport_type` |
| `maximize_category` | `category_name`, `subcategory_name`, `type` |
| `close_maximize` | `category_name`, `subcategory_name`, `type` |
| `hub_profile_click` | `company_name`, `destination_url`, `source`, `medium`, `transport_type` |
| `external_website_click` | `company_name`, `link_url`, `transport_type` |

Parameter semantics:

- **category_name** – Category (e.g. "Field & Mobilization", "Campaign Management & CRM").
- **subcategory_name** – Subcategory when applicable (e.g. "CRM Platforms"); can be `null` for flat categories.
- **type** – `"category"` or `"subcategory"` for maximize/close_maximize.
- **company_name** – Entity name.
- **destination_url** – Path (or URL) for hub profile link.
- **link_url** – URL for “Visit website”.
- **file_name** – Downloaded file name for PDF.
- **source** / **medium** – Attribution (e.g. `eptl`, `map`).
- **transport_type** – `beacon` for outbound/download events.

## Register Custom dimensions so parameters appear in Reports

1. In GA4: **Admin** (gear) → under **Property** → **Custom definitions**.
2. **Create custom dimensions**.
3. For each parameter you want in reports, add one dimension:
   - **Dimension name**: e.g. "Category name" (for reports UI).
   - **Scope**: **Event**.
   - **Event parameter**: **Exact** parameter name from the table above (e.g. `category_name`, `subcategory_name`, `company_name`). Case-sensitive.

Suggested dimensions to create so category/company show in reports:

- **Event parameter**: `category_name` → Dimension name: e.g. "Category name".
- **Event parameter**: `subcategory_name` → Dimension name: e.g. "Subcategory name".
- **Event parameter**: `company_name` → Dimension name: e.g. "Company name" (if not already created).

After saving, use these dimensions in **Explore** (e.g. Free form) by adding them to Rows or Columns; they will also be available in some standard reports. New dimensions apply only to data collected **after** they were created.
