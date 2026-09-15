# Currency Converter

Convert world currencies directly inline inside the OpenClip popup bar and search palette based on global benchmark exchange rates.

## Features

- **Live Inline Results**: See converted currency values instantly in the popup bar button upon selecting a price.
- **Top 30+ Currencies Supported**: Recognizes major symbols (`$`, `€`, `£`, `¥`, `元`, `₹`, `₩`, `CA$`, `AU$`, `NZ$`, `HK$`, `S$`, `NT$`, `R$`, `Mex$`, `RM`, `Rp`, `Kč`, `zł`, `₺`, `฿`, `₪`, `₫`, `₱`) and standard ISO 3-letter currency codes.
- **Configurable Target Currency**: Choose your home currency in Preferences (`USD`, `EUR`, `GBP`, `JPY`, `CNY`, `CAD`, `AUD`, `INR`, `CHF`, `SGD`, `CZK`, etc.).
- **Smart Currency Swapping**: When selecting an amount already in your target currency (e.g., selecting `$50` when target is `USD`), it automatically converts to `EUR` instead of showing a redundant 1:1 conversion.
- **Copy or Paste**: Click to paste the converted amount into your active app, or right-click to copy it to your clipboard.

## Options

Configure options under *Preferences → Actions → Currency Converter*:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Target Currency** | Picker | `USD` | Destination currency to convert into (`USD`, `EUR`, `GBP`, `JPY`, `CNY`, `CAD`, `AUD`, `INR`, `CHF`, `SGD`, `CZK`, etc.). |

## Usage Examples

- Select `€50` → Displays **`$54.35`** inline.
- Select `$100` → Displays **`€92.00`** inline.
- Select `5000 JPY` → Displays **`$32.26`** inline.
- Select `100 GBP` → Displays **`$126.58`** inline.
- Select `500 Kč` → Displays **`$21.55`** inline.

## Requirements

- OpenClip 1.1.0 or later.

