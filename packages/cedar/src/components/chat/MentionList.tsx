import React, {
	forwardRef,
	useState,
	useEffect,
	useImperativeHandle,
} from 'react';

interface MentionItem {
	id: string;
	label: string;
}

interface MentionListProps {
	items: MentionItem[];
	command: (props: MentionItem) => void;
}

interface MentionListRef {
	onKeyDown: (data: { event: React.KeyboardEvent }) => boolean;
}

const MentionList = forwardRef<MentionListRef, MentionListProps>(
	({ items, command }, ref) => {
		const [selectedIndex, setSelectedIndex] = useState(0);

		useEffect(() => {
			setSelectedIndex(0);
		}, [items]);

		const selectItem = (index: number) => {
			const item = items[index];
			if (item) {
				command(item);
			}
		};

		const upHandler = () => {
			setSelectedIndex((selectedIndex + items.length - 1) % items.length);
		};

		const downHandler = () => {
			setSelectedIndex((selectedIndex + 1) % items.length);
		};

		const enterHandler = () => {
			selectItem(selectedIndex);
		};

		useImperativeHandle(ref, () => ({
			onKeyDown: ({ event }: { event: React.KeyboardEvent }) => {
				if (event.key === 'ArrowUp') {
					upHandler();
					return true;
				}
				if (event.key === 'ArrowDown') {
					downHandler();
					return true;
				}
				if (event.key === 'Enter') {
					enterHandler();
					return true;
				}
				return false;
			},
		}));

		return (
			<div className='shadow-lg bg-white rounded-md py-1'>
				{items.length > 0 ? (
					items.map((item, index) => (
						<button
							key={item.id}
							type='button'
							className={`w-full text-left px-3 py-1 hover:bg-gray-200 cursor-pointer ${
								index === selectedIndex ? 'bg-gray-200' : ''
							}`}
							onClick={() => selectItem(index)}>
							{item.label}
						</button>
					))
				) : (
					<div className='px-3 py-1 text-gray-500'>No results</div>
				)}
			</div>
		);
	}
);

export default MentionList;
