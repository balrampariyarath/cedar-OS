'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type Comment = {
	id: string;
	author: string;
	text: string;
};

export type FeatureStatus = 'done' | 'planned' | 'backlog';

export interface FeatureNodeData {
	title: string;
	description: string;
	upvotes: number;
	comments: Comment[];
	status: FeatureStatus;
}

/**
 * FeatureNode – custom node component used in the product roadmap flow.
 * Shows status, description, and basic metrics. Highlights with a thick border
 * when it is currently selected in the flow.
 */
function FeatureNodeComponent({ data, selected }: NodeProps<FeatureNodeData>) {
	const { title, description, upvotes, comments, status } = data;

	const statusColor: Record<FeatureStatus, string> = {
		done: 'bg-green-500',
		planned: 'bg-yellow-500',
		backlog: 'bg-gray-400',
	};

	// When selected, increase border thickness & color.
	const borderClass = selected
		? 'border-4 border-indigo-600'
		: 'border border-gray-200';

	return (
		<div
			className={`relative min-w-[200px] max-w-[240px] rounded-lg bg-white p-4 shadow-sm ${borderClass}`}>
			<div className='mb-2 flex items-center justify-between gap-2'>
				<h3 className='text-sm font-semibold text-gray-900'>{title}</h3>
				<span
					className={`inline-block h-2 w-2 rounded-full ${statusColor[status]}`}
				/>
			</div>
			<p className='mb-3 text-xs text-gray-600 dark:text-gray-300 line-clamp-3'>
				{description}
			</p>
			<div className='flex items-center justify-between text-[11px] text-gray-500'>
				<span>👍 {upvotes}</span>
				<span>💬 {comments.length}</span>
			</div>

			{/* Connection handles */}
			<Handle
				id='left'
				type='target'
				position={Position.Left}
				className='w-3 !bg-indigo-500'
			/>
			<Handle
				id='right'
				type='source'
				position={Position.Right}
				className='w-3 !bg-indigo-500'
			/>
		</div>
	);
}

export const FeatureNode = memo(FeatureNodeComponent);

export default FeatureNode;
