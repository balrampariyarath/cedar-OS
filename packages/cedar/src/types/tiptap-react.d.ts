import type { EditorContentProps } from '@tiptap/react';
import type React from 'react';

declare module '@tiptap/react' {
	/**
	 * Override EditorContent to be recognized as a valid React component
	 */
	export const EditorContent: React.ComponentType<EditorContentProps>;
}
