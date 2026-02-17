
  # European Political Tech Landscape

  This is a code bundle for European Political Tech Landscape. The original project is available at https://www.figma.com/design/hKA06S7FlJOp3aIcg9ffG5/European-Political-Tech-Landscape.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Updating map data (companies and categories)

  **Source of truth:** `map_data.csv`. The map does not read the CSV directly; it uses `public/companiesV2.json`, which is generated from the CSV.

  **One row = one placement.** Each row in the CSV places that entity in one category (and optional subcategory). To list the same company in more than one category (e.g. Qomon in both "Field & Mobilization" and "Campaign Management & CRM"), add a **second row** with the same Entity, Logo, HQ, Domain, Description (and optional Hub URL), but a different Category (and Sub Category as needed).

  **Optional column: Hub URL.** If a company has a Partisan Hub profile, add the URL in the `Hub URL` column. You can leave it empty for others. If a company appears in multiple rows (multiple categories), put the same Hub URL on each row so every placement keeps the hub button.

  **After editing the CSV:** Regenerate the JSON and restart or refresh the app:

  ```bash
  python3 update_companies_v2_json.py
  ```

  **Categories** must match the script’s mapping (e.g. `Campaign Management & CRM`, `Field & Mobilization`, `Research & Intelligence`, etc.). See `update_companies_v2_json.py` for the full list and pillar structure.
  