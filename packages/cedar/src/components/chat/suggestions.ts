import { computePosition, flip, shift } from '@floating-ui/dom';
import { posToDOMRect, ReactRenderer } from '@tiptap/react';
import { Editor } from '@tiptap/core';
import MentionList from '@/components/chat/MentionList';

export interface SuggestionItem {
	id: string;
	label: string;
}

// Default mention items
const defaultMentionItems: SuggestionItem[] = [
	{ id: '1', label: 'Alice' },
	{ id: '2', label: 'Bob' },
	{ id: '3', label: 'Charlie' },
];

// Position the popup under the cursor
const updatePosition = (editor: Editor, element: HTMLElement) => {
	const virtualElement = {
		getBoundingClientRect: () =>
			posToDOMRect(
				editor.view,
				editor.state.selection.from,
				editor.state.selection.to
			),
	};

	computePosition(virtualElement, element, {
		placement: 'bottom-start',
		strategy: 'absolute',
		middleware: [shift(), flip()],
	}).then(({ x, y, strategy }) => {
		element.style.width = 'max-content';
		element.style.position = strategy;
		element.style.left = `${x}px`;
		element.style.top = `${y}px`;
	});
};

// Export a single mention suggestion config
const mentionSuggestion = {
	char: '@',
	startOfLine: false,
	items: ({ query }: { query: string }) =>
		defaultMentionItems
			.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
			.slice(0, 5),
	command: ({ editor, range, props }: any) => {
		editor
			.chain()
			.focus()
			.insertContentAt(range, [
				{ type: 'mention', attrs: { id: props.id, label: props.label } },
			])
			.run();
	},
	render: () => {
		let component: ReactRenderer;

		return {
			onStart: (props: any) => {
				component = new ReactRenderer(MentionList, {
					props,
					editor: props.editor,
				});

				if (!props.clientRect) {
					return;
				}

				const el = component.element as HTMLElement;
				el.style.position = 'absolute';
				document.body.appendChild(el);
				updatePosition(props.editor, el);
			},

			onUpdate: (props: any) => {
				component.updateProps(props);

				if (!props.clientRect) {
					return;
				}

				updatePosition(props.editor, component.element as HTMLElement);
			},

			onKeyDown: (props: any) => {
				const { event } = props;

				if (event.key === 'Escape') {
					component.destroy();
					event.preventDefault();
					event.stopPropagation();
					return true;
				}

				const handled = (component.ref as any)?.onKeyDown(props);
				if (handled) {
					event.preventDefault();
					event.stopPropagation();
				}
				return handled;
			},

			onExit: () => {
				component.destroy();
			},
		};
	},
};

export default mentionSuggestion;
