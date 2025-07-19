'use client';

import { memo, useState, useEffect, useRef } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position, useReactFlow } from 'reactflow';
import { saveNodes } from '@/app/examples/product-roadmap/supabase/nodes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	ChevronDown,
	ChevronUp,
	Package,
	Bug,
	Lightbulb,
	Component,
	Wrench,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type Comment = {
	id: string;
	author: string;
	text: string;
};

export type FeatureStatus = 'done' | 'planned' | 'backlog' | 'in progress';
export type NodeType =
	| 'feature'
	| 'bug'
	| 'improvement'
	| 'component'
	| 'utils';

import { z } from 'zod';

export const FeatureNodeDataSchema = z.object({
	title: z.string(),
	description: z.string(),
	upvotes: z.number(),
	comments: z.array(
		z.object({
			id: z.string(),
			author: z.string(),
			text: z.string(),
		})
	),
	status: z.enum(['done', 'planned', 'backlog', 'in progress']),
	nodeType: z
		.enum(['feature', 'bug', 'improvement', 'component', 'utils'])
		.default('feature'),
	width: z.number().optional(),
	height: z.number().optional(),
	packageVersion: z.string().optional(),
}) satisfies z.ZodType<FeatureNodeData>;

export interface FeatureNodeData {
	title: string;
	description: string;
	upvotes: number;
	comments: Comment[];
	status: FeatureStatus;
	nodeType?: NodeType;
	handleLabels?: Record<string, string>;
	details?: string;
	width?: number;
	height?: number;
	packageVersion?: string;
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
	const {
		title,
		description,
		upvotes,
		comments,
		status,
		nodeType = 'feature',
		width = 320,
		height,
		packageVersion,
	} = data;

	// Inline editing state
	const [editingTitle, setEditingTitle] = useState(false);
	const [titleValue, setTitleValue] = useState(title);
	const [editingDescription, setEditingDescription] = useState(false);
	const [descriptionValue, setDescriptionValue] = useState(description);
	const { setNodes, getZoom } = useReactFlow();

	// Resizing state
	const [isResizing, setIsResizing] = useState(false);
	const [nodeSize, setNodeSize] = useState({ width, height: height || 'auto' });
	const currentSizeRef = useRef({ width, height: height || 'auto' });
	const handleLabelDoubleClick = (handleId: string) => {
		const newLabel = window.prompt('Enter label for handle');
		if (newLabel !== null) {
			setNodes((nds) => {
				const updated = nds.map((n) =>
					n.id === id
						? {
								...n,
								data: {
									...n.data,
									handleLabels: {
										...n.data.handleLabels,
										[handleId]: newLabel,
									},
								},
						  }
						: n
				);
				saveNodes(updated);
				return updated;
			});
		}
	};

	const [showComments, setShowComments] = useState(false);
	const [commentValue, setCommentValue] = useState('');
	const toggleComments = () => setShowComments((prev) => !prev);
	const [expanded, setExpanded] = useState(false);
	const toggleExpanded = () => setExpanded((prev) => !prev);
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
			id: uuidv4(),
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

	// Sync node size with data
	useEffect(() => {
		if (data.width !== undefined || data.height !== undefined) {
			setNodeSize({
				width: data.width || 320,
				height: data.height || 'auto',
			});
			currentSizeRef.current = {
				width: data.width || 320,
				height: data.height || 'auto',
			};
		}
	}, [data.width, data.height]);

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

	// Handle resize
	const handleResize = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsResizing(true);

		const zoom = getZoom();
		const startX = e.clientX;
		const startY = e.clientY;
		const startWidth = nodeSize.width;
		const startHeight =
			typeof nodeSize.height === 'number' ? nodeSize.height : 200;

		const handleMouseMove = (e: MouseEvent) => {
			// Account for zoom level when calculating delta
			const deltaX = (e.clientX - startX) / zoom;
			const deltaY = (e.clientY - startY) / zoom;

			const newWidth = Math.max(200, startWidth + deltaX);
			const newHeight = Math.max(150, startHeight + deltaY);
			setNodeSize({ width: newWidth, height: newHeight });
			currentSizeRef.current = { width: newWidth, height: newHeight };

			// Update node data in real-time
			setNodes((nds) =>
				nds.map((n) =>
					n.id === id
						? { ...n, data: { ...n.data, width: newWidth, height: newHeight } }
						: n
				)
			);
		};

		const handleMouseUp = () => {
			setIsResizing(false);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);

			// Save the final size using the ref
			const finalWidth = currentSizeRef.current.width;
			const finalHeight = currentSizeRef.current.height;

			setNodes((nds) => {
				const updated = nds.map((n) =>
					n.id === id
						? {
								...n,
								data: {
									...n.data,
									width: finalWidth,
									height: finalHeight,
								},
						  }
						: n
				);
				saveNodes(updated);
				return updated;
			});
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	};

	// Handle status change
	const handleStatusChange = (newStatus: FeatureStatus) => {
		setNodes((nds) => {
			const updated = nds.map((n) =>
				n.id === id ? { ...n, data: { ...n.data, status: newStatus } } : n
			);
			saveNodes(updated);
			return updated;
		});
	};

	const statusColor: Record<FeatureStatus, string> = {
		done: 'bg-green-400/70',
		planned: 'bg-yellow-400/70',
		backlog: 'bg-gray-400/70',
		'in progress': 'bg-blue-400/70',
	};

	const nodeTypeColor: Record<NodeType, string> = {
		feature: 'bg-purple-400/70',
		bug: 'bg-red-400/70',
		improvement: 'bg-cyan-400/70',
		component: 'bg-blue-400/70',
		utils: 'bg-orange-400/70',
	};

	// Icon mapping for node types
	const nodeTypeIcon: Record<NodeType, React.ReactNode> = {
		feature: <Package className='h-3 w-3' />,
		bug: <Bug className='h-3 w-3' />,
		improvement: <Lightbulb className='h-3 w-3' />,
		component: <Component className='h-3 w-3' />,
		utils: <Wrench className='h-3 w-3' />,
	};

	// Soft background colors for status
	const statusBackgroundColor: Record<FeatureStatus, string> = {
		done: 'bg-green-50',
		planned: 'bg-yellow-50',
		backlog: 'bg-gray-50',
		'in progress': 'bg-blue-50',
	};

	// All available statuses
	const allStatuses: FeatureStatus[] = [
		'done',
		'planned',
		'backlog',
		'in progress',
	];

	// When selected, add an outer ring highlight without affecting inner layout
	const borderClass = selected
		? 'border border-gray-200 ring-4 ring-indigo-600'
		: 'border border-gray-200';

	return (
		<div
			className={`relative rounded-lg p-4 shadow-sm ${borderClass} ${
				statusBackgroundColor[status]
					? statusBackgroundColor[status]
					: 'bg-white'
			} ${isResizing ? 'select-none' : ''}`}
			style={{
				width: `${nodeSize.width}px`,
				height: nodeSize.height === 'auto' ? 'auto' : `${nodeSize.height}px`,
				minWidth: '200px',
				minHeight: '150px',
			}}>
			<div className='mb-2'>
				<div className='flex items-center justify-between gap-2 mb-1'>
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
							className='text-sm font-semibold text-gray-900 flex-1'
							onDoubleClick={() => setEditingTitle(true)}
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === 'Enter') setEditingTitle(true);
							}}
							aria-label='Edit title'>
							{title}
						</h3>
					)}
					<Button
						variant='ghost'
						size='icon'
						className='h-6 w-6'
						onClick={toggleExpanded}
						aria-label={expanded ? 'Collapse details' : 'Expand details'}>
						{expanded ? (
							<ChevronUp className='h-4 w-4' />
						) : (
							<ChevronDown className='h-4 w-4' />
						)}
					</Button>
				</div>
				<div className='flex items-center gap-1'>
					<Badge className={nodeTypeColor[nodeType]} variant='secondary'>
						<span className='flex items-center gap-1'>
							{nodeTypeIcon[nodeType]}
							{nodeType}
						</span>
					</Badge>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Badge
								className={`${statusColor[status]} cursor-pointer hover:opacity-80`}
								variant='secondary'
								tabIndex={0}
								role='button'
								aria-label='Change status'>
								{status}
							</Badge>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='start'>
							{allStatuses.map((statusOption) => (
								<DropdownMenuItem
									key={statusOption}
									onClick={() => handleStatusChange(statusOption)}
									className='cursor-pointer'>
									<Badge
										className={`${statusColor[statusOption]} mr-2`}
										variant='secondary'>
										{statusOption}
									</Badge>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
					{status === 'done' && packageVersion && (
						<Badge variant='outline' className='text-xs'>
							v{packageVersion}
						</Badge>
					)}
				</div>
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
				<div className='flex items-center gap-2'>
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
			</div>
			{expanded && (
				<div className='mt-2 text-xs text-gray-700'>
					<ReactMarkdown remarkPlugins={[remarkGfm]}>
						{data.details || 'No details provided.'}
					</ReactMarkdown>
				</div>
			)}
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
				className='w-3 !bg-indigo-500 relative flex items-center justify-center'
				onDoubleClick={() => handleLabelDoubleClick('left')}
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter') handleLabelDoubleClick('left');
				}}>
				{data.handleLabels?.['left'] && (
					<span className='absolute -left-8 bg-white text-xs text-gray-700 px-1 rounded'>
						{data.handleLabels['left']}
					</span>
				)}
			</Handle>
			<Handle
				id='right'
				type='source'
				position={Position.Right}
				className='w-3 !bg-indigo-500 relative flex items-center justify-center'
				onDoubleClick={() => handleLabelDoubleClick('right')}
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter') handleLabelDoubleClick('right');
				}}>
				{data.handleLabels?.['right'] && (
					<span className='absolute -right-8 bg-white text-xs text-gray-700 px-1 rounded'>
						{data.handleLabels['right']}
					</span>
				)}
			</Handle>

			{/* Resize handle */}
			<div
				className='absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-gray-200 rounded-br-lg nodrag'
				onMouseDown={handleResize}
				style={{
					background: 'linear-gradient(135deg, transparent 50%, #e5e7eb 50%)',
				}}
				aria-label='Resize node'
			/>
		</div>
	);
}

export const FeatureNode = memo(FeatureNodeComponent);

export default FeatureNode;
