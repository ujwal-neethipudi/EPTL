# Demo flow: adding a company (no Python required)

Use this when demoing a company addition on a call. Everything uses **Node** (npm); Python is not required.

---

## One-time setup (if not done yet)

- **Mac:** Double‑click `Setup.command`  
- **Windows:** Double‑click `Setup.bat`  

This runs `npm install` so the Excel→JSON script has its dependencies. Only needed once per machine (or after cloning the repo).

---

## Steps to add a company during the demo

1. **Open** `map_data.xlsx` in Excel.

2. **Add one new row** with:
   - **S. No.** — next free number (e.g. 142 if the last row is 141).
   - **Entity** — company name.
   - **Logo** — full URL, e.g. `https://eptl.vercel.app/logos/example-com.png`  
     *Naming:* domain with dots → hyphens + `.png` (e.g. `example.com` → `example-com.png`).
   - **HQ** — country.
   - **Domain** — company website, e.g. `https://example.com/`.
   - **Description** — one short line.
   - **Category** — e.g. `Campaign Management & CRM`.
   - **Sub Category** — e.g. `CRM Platforms` (must match existing subcategories for that category).
   - **Tools/Products** — optional; can leave blank.
   - **Hub URL** — optional; leave blank unless they have a Partisan Hub profile.

3. **Save** the workbook (Ctrl+S / Cmd+S).

4. **Run “Update map”**  
   - **Mac:** Double‑click `Update map.command`  
   - **Windows:** Double‑click `Update map.bat`  
   Wait until it says *“Done. Open GitHub Desktop…”*.

5. **Commit and push**  
   Open **GitHub Desktop** → you should see changes in `map_data.xlsx` and `public/companiesV2.json` → write a commit message → **Commit** → **Push**.

6. After the site redeploys (e.g. Vercel), the new company appears on the map.

---

## Summary of what changed (Node instead of Python)

| Before (Python) | Now (Node) |
|-----------------|------------|
| Run `Setup.command` / `Setup.bat` to create a Python venv and install openpyxl | Run `Setup.command` / `Setup.bat` to run `npm install` (installs xlsx + csv-parse) |
| `Update map` ran a Python script | `Update map` runs `npm run update-map` (Node script) |
| Required Python 3 on the machine | Requires Node/npm only (same as the rest of the project) |

The **demo steps are the same**: edit Excel → run Update map → commit and push in GitHub Desktop. Only the tools under the hood (Node instead of Python) changed.
