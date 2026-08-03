# Source verification - Orechdin homepage

**Source URL:** https://www.orechdin.be/

**Captured snapshot:** `snapshots/homepage-verified.html` (full HTML as served; embedded JSON `requestUrl` must read `https://www.orechdin.be/` - homepage only, not `/the-office` as primary).

| Check | Value |
|--------|--------|
| Page title | Home \| Orechdin \| Antwerpen |
| Canonical (link rel) | https://www.orechdin.be |
| Hero heading | Lawyers |
| Hero line | we will fight for your rights |
| CTA labels | Call us, Mail us |
| Navigation | Home, The Lawyers, Services, Contact |
| Value copy | Our Law Office provides complete, effective and individual legal services; in the very heart of Antwerp |
| Lawyer names | Nir Zeltzer; Deborah Johnson |
| Supporting copy (DOM) | First block: “highly experienced…” line break then “accurate and relevant advice”; second block: “strong representation in court” |
| Office CTA | Learn more about our office → https://www.orechdin.be/the-office |
| Contact | Lange Herentalsestraat 122, 2018 – Antwerpen, Belgium; +32 3 227 50 57; info@orechdin.be |
| Disclaimer | Disclaimer: Orechdin Law Office can not commit to any result, but will make all efforts to achieve the best possible result. |
| Footer | copyright © 2025 - ORECHDIN BV; privacy policy → https://www.orechdin.be/privacy-policy |

**Homepage background (verified in snapshot):** `42e0d7_1088b9ad781249f198548d90e755952c~mv2.jpg` on `pageBackground_c1dmp`.

**Theme tokens extracted from snapshot CSS:** `--color_45: 213,213,213` → supporting text `rgb(213, 213, 213)` (same as value strip `#d5d5d5`). **Section overlays (compCssMappers / mesh):** hero strip `comp-lbt3ma30` uses `linear-gradient(180deg, rgba(0,0,0,0.97) 37.24%, rgba(32,35,44,0.7) 100%)`; value strip `comp-lbm1bbwf` uses flat `rgba(32,35,44,0.7)`; lawyers column `comp-ktzroqll` uses `linear-gradient(180deg, rgba(32,35,44,0.7) 0%, rgba(0,0,0,0.84) 100%)`. Lawyer name buttons (`comp-lbm6rz3z` / `comp-lbm6uqsk`): fill `rgba(175,97,24,0.59)`, hover `#814711`, label `font-size: 12px`, `letter-spacing: 0.1em`, Avenir Light. Learn-more `comp-krwiy33f`: border maps to `--color_36` → `rgb(43,43,43)`, size `238×80`, transparent fill.

**Fonts referenced on homepage (mirrored locally):** Avenir LT W01 35 Light (WOFF2 w01 + w05), Avenir LT W01 85 Heavy (WOFF2 w01 + w05) from `static.parastorage.com` URLs embedded in the snapshot.

**Layout (from Wix mesh, desktop ≥981px):** “The Lawyers” heading; row of two 168×168 portraits (Nir `left:239px`, Deborah `left:584px`, ≈177px gap); row of two name buttons 142×40 (`left:252px` / `left:597px`); supporting copy; learn-more 238×80. Below ~880px the clone stacks portraits and names in one column.

**Active build parity (must stay aligned with `stylableCss_c1dmp`):** Hero **Call us** and **Mail us** are the same control skin - `142×40`, `background: rgb(0,0,0)`, `border: 1px solid #828181`, label `15px` Avenir Light, `letter-spacing: 0.1em`, hover `rgba(0,0,0,0.5)` with heavier label sizing; chevrons are **not** visible on the live page (`display: none` on icon). The value strip must remain **full-bleed** `rgba(32,35,44,0.7)` under `section.value` (not only the inner `.container`). Footer rich text on live uses `#FFFFFF` for all lines including disclaimer (see `SITE_FOOTER` markup).
