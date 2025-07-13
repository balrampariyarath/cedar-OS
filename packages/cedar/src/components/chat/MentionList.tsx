import React from 'react';

interface MentionItem {
	id: string;
	label: string;
}

interface MentionListProps {
	items: MentionItem[];
	command: (props: MentionItem) => void;
}

const MentionList: React.FC<MentionListProps> = ({ items, command }) => {
	return (
		<div className='shadow-lg bg-white rounded-md py-1'>
			{items.length > 0 ? (
				items.map((item) => (
					<div
						key={item.id}
						className='px-3 py-1 hover:bg-gray-200 cursor-pointer'
						onClick={() => command(item)}>
						{item.label}
					</div>
				))
			) : (
				<div className='px-3 py-1 text-gray-500'>No results</div>
			)}
		</div>
	);
};

export default MentionList;
