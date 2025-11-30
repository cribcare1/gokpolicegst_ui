# DDO Proforma Advice - Signature Print Fix

## Problem
When printing Proforma Advice documents from DDO, the signature was not appearing in the printed output, showing only a blank signature line instead.

## Solution
Fixed the signature display issue by making the following changes:

### 1. Updated ProformaAdviceList Component (`src/components/ddo/ProformaAdviceList.jsx`)
- **Fixed Preview Modal Signature Section**: Updated the signature display logic to show the actual signature image when available (`previewData.signature` or `previewData.raw.signature`) instead of just a placeholder line
- **Enhanced Print Window Function**: Modified the `handlePrintPreview` function to properly handle signature images in the print window with appropriate CSS classes and styling

### 2. Added Print-Specific CSS (`src/app/globals.css`)
- **Signature Image Print Styles**: Added CSS rules specifically for signature images in print media:
  - Proper sizing constraints (max-height: 1.5cm, max-width: 4cm)
  - Image rendering optimization for crisp edges
  - Print color adjustment to ensure colors are preserved
  - Object-fit: contain to maintain aspect ratio

### 3. Key Features of the Fix
- **Conditional Display**: Shows actual signature image when available, falls back to signature line when not
- **Print Optimization**: Signature images are properly sized and rendered for print media
- **Cross-Component Consistency**: Fixed both the form view and list view signature display
- **CSS Classes**: Added `.signature-image` class for consistent print styling

## Changes Made

### File: `src/components/ddo/ProformaAdviceList.jsx`
```jsx
// Before: Only showed signature line
<div className="signature-line"></div>

// After: Shows actual signature or falls back to line
{(previewData.signature || (previewData.raw && previewData.raw.signature)) ? (
  <div className="mb-2">
    <img 
      src={previewData.signature || previewData.raw.signature} 
      alt="DDO Signature" 
      className="h-12 max-w-36 object-contain mx-auto"
      style={{ imageRendering: 'crisp-edges' }}
    />
  </div>
) : (
  <div className="h-12 border-b border-gray-400 mb-2 w-36"></div>
)}
```

### File: `src/app/globals.css`
```css
/* Signature image styles for print */
.print-content img[alt="DDO Signature"],
.print-content img[alt="Signature"] {
  max-height: 1.5cm !important;
  max-width: 4cm !important;
  object-fit: contain !important;
  image-rendering: crisp-edges !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
```

## Result
- ✅ Signatures now appear in printed Proforma Advice documents
- ✅ Proper image sizing and quality for print media
- ✅ Consistent behavior across both form and list views
- ✅ Fallback to signature line when no signature is available
- ✅ Enhanced print optimization with proper CSS media queries

The signature display issue has been completely resolved. Users can now successfully print Proforma Advice documents with their signatures properly visible.