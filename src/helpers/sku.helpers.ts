/**
 * Generate a SKU in the format: CHV-BRAND_ABBR-CATEGORY_ABBR-SIZE-RANDOM_4_DIGITS
 * @param brandAbbr - Brand abbreviation (e.g., "NKE" for Nike)
 * @param categoryAbbr - Category abbreviation (e.g., "SHO" for Shoes)
 * @param sizeVariation - Optional size variation (e.g., "XL", "42", "500ML")
 * @returns Generated SKU
 */
export const generateSKU = (
  brandAbbr: string,
  categoryAbbr: string,
  sizeVariation?: string | null
): string => {
  // Ensure abbreviations are uppercase and max 3 chars
  /* const brandPart = brandAbbr.toUpperCase().substring(0, 3);
  const categoryPart = categoryAbbr.toUpperCase().substring(0, 3); */
  const brandPart = brandAbbr.toUpperCase();
  const categoryPart = categoryAbbr.toUpperCase();

  // Generate random 4-digit number
  const randomDigits = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  // Build SKU parts
  const parts = ["CHV", brandPart, categoryPart];

  if (sizeVariation && sizeVariation.trim()) {
    const sizePart = sizeVariation.toUpperCase().substring(0, 5);
    parts.push(sizePart);
  }

  parts.push(randomDigits);

  return parts.join("-");
};
