'use client';

import { memo, useState, useEffect } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position, useReactFlow } from 'reactflow';
import { saveNodes } from '@/app/examples/product-roadmap/supabase/nodes';

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
function FeatureNodeComponent({
	id,
	data,
	selected,
}: NodeProps<FeatureNodeData>) {
	const { title, description, upvotes, comments, status } = data;

	// Inline editing state
	const [editingTitle, setEditingTitle] = useState(false);
	const [titleValue, setTitleValue] = useState(title);
	const [editingDescription, setEditingDescription] = useState(false);
	const [descriptionValue, setDescriptionValue] = useState(description);
	const { setNodes } = useReactFlow();

	const [showComments, setShowComments] = useState(false);
	const [commentValue, setCommentValue] = useState('');
	const toggleComments = () => setShowComments((prev) => !prev);
	const handleUpvote = () => {
		setNodes((nds) => {
			const updated = nds.map((n) =>
				n.id === id
					? { ...n, data: { ...n.data, upvotes: n.data.upvotes + 1 } }
					: n
			);
			saveNodes(updated);
			return updated;
		});
	};
	const handleAddComment = () => {
		const trimmed = commentValue.trim();
		if (!trimmed) return;
		const newComment: Comment = {
			id: Date.now().toString(),
			author: 'Anonymous',
			text: trimmed,
		};
		setNodes((nds) => {
			const updated = nds.map((n) =>
				n.id === id
					? {
							...n,
							data: { ...n.data, comments: [...n.data.comments, newComment] },
					  }
					: n
			);
			saveNodes(updated);
			return updated;
		});
		setCommentValue('');
	};

	useEffect(() => {
		if (!editingTitle) setTitleValue(data.title);
	}, [data.title, editingTitle]);

	useEffect(() => {
		if (!editingDescription) setDescriptionValue(data.description);
	}, [data.description, editingDescription]);

	const commitTitle = () => {
		setNodes((nds) => {
			const updated = nds.map((n) =>
				n.id === id ? { ...n, data: { ...n.data, title: titleValue } } : n
			);
			saveNodes(updated);
			return updated;
		});
	};

	const commitDescription = () => {
		setNodes((nds) => {
			const updated = nds.map((n) =>
				n.id === id
					? { ...n, data: { ...n.data, description: descriptionValue } }
					: n
			);
			saveNodes(updated);
			return updated;
		});
	};

	const statusColor: Record<FeatureStatus, string> = {
		done: 'bg-green-500',
		planned: 'bg-yellow-500',
		backlog: 'bg-gray-400',
	};

	// When selected, add an outer ring highlight without affecting inner layout
	const borderClass = selected
		? 'border border-gray-200 ring-4 ring-indigo-600'
		: 'border border-gray-200';

	return (
		<div
			className={`relative min-w-[200px] max-w-[240px] rounded-lg bg-white p-4 shadow-sm ${borderClass}`}>
			<div className='mb-2 flex items-center justify-between gap-2'>
				{editingTitle ? (
					<input
						autoFocus
						value={titleValue}
						onChange={(e) => setTitleValue(e.target.value)}
						onBlur={() => {
							commitTitle();
							setEditingTitle(false);
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								commitTitle();
								setEditingTitle(false);
								e.currentTarget.blur();
							}
							if (e.key === 'Escape') {
								setTitleValue(data.title);
								setEditingTitle(false);
							}
						}}
						className='w-full text-sm font-semibold text-gray-900 border border-gray-300 rounded p-1'
					/>
				) : (
					<h3
						className='text-sm font-semibold text-gray-900'
						onDoubleClick={() => setEditingTitle(true)}
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === 'Enter') setEditingTitle(true);
						}}
						aria-label='Edit title'>
						{title}
					</h3>
				)}
				<span
					className={`inline-block h-2 w-2 rounded-full ${statusColor[status]}`}
				/>
			</div>
			{editingDescription ? (
				<textarea
					autoFocus
					value={descriptionValue}
					onChange={(e) => setDescriptionValue(e.target.value)}
					onBlur={() => {
						commitDescription();
						setEditingDescription(false);
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							commitDescription();
							setEditingDescription(false);
						}
						if (e.key === 'Escape') {
							setDescriptionValue(data.description);
							setEditingDescription(false);
						}
					}}
					rows={3}
					className='w-full text-xs text-gray-600 dark:text-gray-300 border border-gray-300 rounded p-1'
				/>
			) : (
				<p
					className='mb-3 text-xs text-gray-600 dark:text-gray-300 line-clamp-3'
					onDoubleClick={() => setEditingDescription(true)}
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === 'Enter') setEditingDescription(true);
					}}
					aria-label='Edit description'>
					{description}
				</p>
			)}
			<div className='flex items-center justify-between text-[11px] text-gray-500'>
				<button
					onClick={handleUpvote}
					className='flex items-center gap-1'
					aria-label='Upvote feature'
					title='Upvote'>
					👍 {upvotes}
				</button>
				<button
					onClick={toggleComments}
					className='flex items-center gap-1'
					aria-label='Toggle comments'
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							toggleComments();
						}
					}}>
					💬 {comments.length}
				</button>
			</div>
			{showComments && (
				<div className='mt-2 space-y-1'>
					{comments.map((c) => (
						<div key={c.id} className='text-xs'>
							<strong>{c.author}:</strong> {c.text}
						</div>
					))}
					<div className='mt-1 flex'>
						<input
							type='text'
							placeholder='Add a comment'
							value={commentValue}
							onChange={(e) => setCommentValue(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									handleAddComment();
								}
							}}
							className='w-full text-xs border border-gray-300 rounded p-1'
							aria-label='New comment'
						/>
						<button
							onClick={handleAddComment}
							className='ml-2 text-xs text-blue-500'>
							Post
						</button>
					</div>
				</div>
			)}

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
