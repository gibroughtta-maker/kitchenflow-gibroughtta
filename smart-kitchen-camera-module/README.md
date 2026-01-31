# Smart Kitchen Camera Module

This is a standalone extraction of the AI Camera Scanner module from Smart Kitchen AI.
It provides React components and services to scan inventory, receipts, and invoices using Google Gemini AI.

## Features
- **Fridge Audit**: Take up to 5 photos of a fridge; AI counts items and merges results.
- **Invoice OCR**: Scan supplier invoices to extract line items and costs.
- **Sales Receipt**: Scan restaurant POS receipts.

## Setup

1. Copy this folder into your project (e.g., `src/features/camera`).
2. Install dependencies:
   ```bash
   npm install lucide-react
   ```
   (Ensure you have `react` and `tailwindcss` set up).

## Usage

```tsx
import { Scanner } from './camera/components/Scanner';

function App() {
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (result, mode) => {
    console.log("Scan Result:", result);
    // mode is 'fridge', 'receipt', or 'sales'
  };

  return (
    <>
      <button onClick={() => setShowScanner(true)}>Open Scanner</button>

      {showScanner && (
        <Scanner 
          apiKey="YOUR_GEMINI_API_KEY" 
          onClose={() => setShowScanner(false)}
          onScanComplete={handleScan}
          initialMode="fridge" // or 'receipt'
        />
      )}
    </>
  );
}
```

## Structure
- `components/Scanner.tsx`: Main UI component.
- `services/scannerService.ts`: AI service (calls Google Gemini API directly).
- `utils/imageProcessing.ts`: Browser-based image compression and enhancement.

## Configuration
You can also configure the scanner globally:
```ts
import { configureScanner } from './services/scannerService';

configureScanner({ apiKey: '...' });
```
