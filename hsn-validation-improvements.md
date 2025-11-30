# HSN/SSC Code Validation Improvements

## Summary
Added validation to ensure HSN/SSC codes do not exceed 8 characters in the admin section.

## Changes Made

### 1. Updated HSN Master Data Form (`src/app/admin/master-data/hsn/page.jsx`)
- **Line 992**: Added `maxLength: 8` attribute to the HSN code field configuration
- This prevents users from entering more than 8 characters in the input field

### 2. Enhanced Validation Function (`src/lib/gstUtils.js`)
- **Lines 415-428**: Improved the `validateHSN` function with clearer error messages
- Separated validation for minimum length (4 digits) and maximum length (8 characters)
- Updated error message to be more specific: "HSN code cannot exceed 8 characters"

## Validation Rules

### Current HSN/SSC Code Validation:
1. **Required**: HSN/SSC code cannot be empty
2. **Minimum Length**: Must be at least 4 digits
3. **Maximum Length**: Cannot exceed 8 characters
4. **Numeric Only**: Only digits are allowed (non-digits are automatically removed)
5. **Form Input Limit**: HTML `maxLength="8"` attribute prevents typing more than 8 characters

### Error Messages:
- "HSN code is required" - when field is empty
- "HSN code must be at least 4 digits" - when less than 4 characters
- "HSN code cannot exceed 8 characters" - when more than 8 characters

## Impact

### User Experience Improvements:
- **Prevention**: Users cannot type more than 8 characters in the input field
- **Clear Feedback**: Immediate validation feedback with specific error messages
- **Consistent Validation**: Same validation rules apply both on client-side and server-side

### Business Logic Compliance:
- Ensures compliance with GST regulations that HSN codes should not exceed 8 characters
- Prevents data integrity issues by enforcing character limits at the form level
- Reduces server-side validation failures

## Files Modified:
1. `src/app/admin/master-data/hsn/page.jsx` - Added maxLength attribute to form field
2. `src/lib/gstUtils.js` - Enhanced validation function with clearer error messages

## Testing Recommendations:
1. Try entering HSN codes with more than 8 characters
2. Verify that the input field prevents typing beyond 8 characters
3. Test validation messages for various scenarios (empty, too short, too long)
4. Ensure existing valid HSN codes (4-8 digits) still work correctly