import React from 'react';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';

export const MentionNodeView: React.FC<NodeViewProps> = ({ node }) => {
	const { id, label } = node.attrs || {};

	return (
		<NodeViewWrapper
			as='span'
			className='bg-blue-100 text-blue-800 px-1 rounded mention inline-flex items-center'
			contentEditable={false}
			data-mention-id={id}
			aria-label={`Mention ${label}`}
			tabIndex={0}>
			@{label}
		</NodeViewWrapper>
	);
};
