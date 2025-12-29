/**
 * Utility functions for formatting weight and height values
 * based on the selected display units in settings
 */

/**
 * Cleans a weight value by removing any existing unit labels
 * @param weightValue - The weight value string (e.g., "86.2kg lbs", "90 lbs", "86.2")
 * @returns The numeric value as a string without units
 */
export function cleanWeightValue(weightValue: string): string {
  if (!weightValue || weightValue === 'N/A') return weightValue;
  
  // Remove common unit labels (lbs, kg, g, and variations)
  return weightValue
    .replace(/\s*(lbs?|kg|kilograms?|pounds?|g|grams?)\s*/gi, '')
    .trim();
}

/**
 * Formats a weight value with the appropriate unit label
 * @param weightValue - The weight value (may contain units or be just a number)
 * @param unit - The unit to display ('lbs', 'kg', or 'g')
 * @returns Formatted weight string with unit
 */
export function formatWeight(weightValue: string, unit: string = 'lbs'): string {
  if (!weightValue || weightValue === 'N/A') return 'N/A';
  
  // Clean the value first
  const cleanedValue = cleanWeightValue(weightValue);
  
  // Get unit label
  const unitLabel = getWeightUnitLabel(unit);
  
  return `${cleanedValue} ${unitLabel}`;
}

/**
 * Gets the display label for a weight unit
 */
export function getWeightUnitLabel(unit: string): string {
  const labels: { [key: string]: string } = {
    lbs: 'lbs',
    kg: 'kg',
    g: 'g',
  };
  return labels[unit] || 'lbs';
}

/**
 * Formats a height value with the appropriate unit label
 * @param heightValue - The height value
 * @param unit - The unit to display ('inches', 'cm', 'm', 'feet')
 * @returns Formatted height string with unit
 */
export function formatHeight(heightValue: string, unit: string = 'inches'): string {
  if (!heightValue || heightValue === 'N/A') return 'N/A';
  
  // Remove existing unit labels if any
  const cleanedValue = heightValue
    .replace(/\s*(inches?|cm|centimeters?|m|meters?|feet?|ft)\s*/gi, '')
    .trim();
  
  // Get unit label
  const unitLabel = getHeightUnitLabel(unit);
  
  return `${cleanedValue} ${unitLabel}`;
}

/**
 * Gets the display label for a height unit
 */
export function getHeightUnitLabel(unit: string): string {
  const labels: { [key: string]: string } = {
    inches: 'in',
    cm: 'cm',
    m: 'm',
    feet: 'ft',
  };
  return labels[unit] || 'in';
}

/**
 * Formats height with feet and inches if feet value is provided
 * @param heightValue - The height value (inches, cm, etc.)
 * @param feetValue - The feet value (e.g., "5'10\"")
 * @param unit - The unit to display ('inches', 'cm', 'm', 'feet')
 * @returns Formatted height string
 */
export function formatHeightWithFeet(
  heightValue: string | null | undefined,
  feetValue: string | null | undefined,
  unit: string = 'inches'
): string {
  // If feet value is provided, prioritize it
  if (feetValue) {
    return feetValue;
  }
  
  // Otherwise, format the height value
  if (!heightValue || heightValue === 'N/A') return 'N/A';
  
  return formatHeight(heightValue, unit);
}

