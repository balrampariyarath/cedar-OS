import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind's merge utility
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Shades a color by a percentage
 * @param color - The base color in hex format
 * @param percent - The percentage to shade by (0-100)
 */
export function getShadedColor(color: string, percent: number): string {
	// Remove the # if it exists
	let hex = color.replace('#', '');

	// Convert 3-digit hex to 6-digit
	if (hex.length === 3) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	}

	// Convert hex to RGB
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);

	// Calculate the shaded color
	const shadeFactor = percent / 100;
	const shadedR = Math.round(r * shadeFactor);
	const shadedG = Math.round(g * shadeFactor);
	const shadedB = Math.round(b * shadeFactor);

	// Convert back to hex
	return `#${shadedR.toString(16).padStart(2, '0')}${shadedG
		.toString(16)
		.padStart(2, '0')}${shadedB.toString(16).padStart(2, '0')}`;
}

/**
 * Creates a border color based on the background color
 * @param color - The background color in hex format
 */
export function createBorderColor(color: string): string {
	// For now, just shade the color by 30%
	return getShadedColor(color, 70);
}

/**
 * Determines if a color is light or dark
 * @param color - The color in hex format
 */
function isLightColor(color: string): boolean {
	// Remove the # if it exists
	const hex = color.replace('#', '');

	// Convert 3-digit hex to 6-digit
	const fullHex =
		hex.length === 3
			? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
			: hex;

	// Convert hex to RGB
	const r = parseInt(fullHex.substring(0, 2), 16);
	const g = parseInt(fullHex.substring(2, 4), 16);
	const b = parseInt(fullHex.substring(4, 6), 16);

	// Calculate luminance
	// Formula: (0.299*R + 0.587*G + 0.114*B)
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

	// Return true if light, false if dark
	return luminance > 0.5;
}

/**
 * Gets the appropriate text color for a background
 * @param backgroundColor - The background color in hex format
 */
export function getTextColorForBackground(backgroundColor: string): string {
	return isLightColor(backgroundColor) ? '#000000' : '#ffffff';
}
