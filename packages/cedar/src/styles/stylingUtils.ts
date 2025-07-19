import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cloneElement, isValidElement, type ReactNode } from 'react';

/**
 * Combines class names with Tailwind's merge utility
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Convert a hex string to its RGB components
export const hexToRgb = (hex: string) => {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return { r, g, b };
};

// Generate a darker (shaded) version of a color
export const getShadedColor = (hex: string, shade: number) => {
	const { r, g, b } = hexToRgb(hex);
	return `rgb(${Math.max(0, r - shade)}, ${Math.max(0, g - shade)}, ${Math.max(
		0,
		b - shade
	)})`;
};

// Generate a lighter version of a color
export const getLightenedColor = (hex: string, lighten: number) => {
	const { r, g, b } = hexToRgb(hex);
	return `rgb(${Math.min(255, r + lighten)}, ${Math.min(
		255,
		g + lighten
	)}, ${Math.min(255, b + lighten)})`;
};

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

/**
 * Adds className to a React element if it's a valid element
 * Otherwise returns the node as-is
 */
export function withClassName(node: ReactNode, className: string): ReactNode {
	if (isValidElement(node)) {
		return cloneElement(node, {
			className: cn(node.props.className, className),
		} as any);
	}
	return node;
}
