'use client';

import React from 'react';
import ReactFlow, {
	addEdge,
	Background,
	Connection,
	ConnectionLineType,
	Controls,
	Edge,
	MarkerType,
	Node,
	NodeTypes,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
	useOnSelectionChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

import {
	FeatureNode,
	FeatureNodeData,
} from '@/app/examples/product-roadmap/components/FeatureNode';
import {
	getEdges,
	saveEdges,
} from '@/app/examples/product-roadmap/supabase/edges';
import {
	deleteNode,
	getNodes,
	saveNodes,
} from '@/app/examples/product-roadmap/supabase/nodes';
import {
	ChatInput,
	subscribeInputContext,
	useRegisterState,
	useStateBasedMentionProvider,
} from 'cedar';
import { ArrowRight, Box, CheckCircle, Loader } from 'lucide-react';
import { motion } from 'motion/react';

// -----------------------------------------------------------------------------
// NodeTypes map (defined once to avoid React Flow error 002)
// -----------------------------------------------------------------------------

const nodeTypes: NodeTypes = {
	featureNode: FeatureNode,
};

// -----------------------------------------------------------------------------
// Flow Canvas component (previous logic)
// -----------------------------------------------------------------------------

function FlowCanvas() {
	// Controlled state for nodes & edges - start with empty arrays
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	// Saving/loading state
	const [isSaving, setIsSaving] = React.useState(false);
	const [hasSaved, setHasSaved] = React.useState(false);
	const initialMount = React.useRef(true);
	const saveTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	// Register states using the hook version that handles useEffect internally
	useRegisterState({
		value: nodes,
		setValue: setNodes,
		key: 'nodes',
		description: 'Product roadmap nodes',
		customSetters: {
			addNode: {
				name: 'addNode',
				description: 'Add a new node to the roadmap',
				parameters: [
					{
						name: 'node',
						type: 'Node<FeatureNodeData>',
						description: 'The node to add',
					},
				],
				execute: (currentNodes, node) => {
					const nodes = currentNodes as Node<FeatureNodeData>[];
					const nodeData = node as Node<FeatureNodeData>;
					const newNode = {
						...nodeData,
						id: nodeData.id || uuidv4(),
						data: {
							...nodeData.data,
							nodeType: nodeData.data.nodeType || 'feature',
							status: nodeData.data.status || 'planned',
							upvotes: nodeData.data.upvotes || 0,
							comments: nodeData.data.comments || [],
						},
					};
					setNodes([...nodes, newNode]);
				},
			},
			removeNode: {
				name: 'removeNode',
				description: 'Remove a node from the roadmap',
				parameters: [
					{
						name: 'id',
						type: 'string',
						description: 'The ID of the node to remove',
					},
				],
				execute: async (currentNodes, id) => {
					const nodeId = id as string;
					// Soft delete in the database
					await deleteNode(nodeId);
					// Remove from local state
					const nodes = currentNodes as Node<FeatureNodeData>[];
					setNodes(nodes.filter((node) => node.id !== nodeId));
					// Also remove any edges connected to this node
					setEdges((edges) =>
						edges.filter(
							(edge) => edge.source !== nodeId && edge.target !== nodeId
						)
					);
				},
			},
			changeNode: {
				name: 'changeNode',
				description: 'Update an existing node in the roadmap',
				parameters: [
					{
						name: 'newNode',
						type: 'Node<FeatureNodeData>',
						description: 'The updated node data',
					},
				],
				execute: (currentNodes, newNode) => {
					const nodes = currentNodes as Node<FeatureNodeData>[];
					const updatedNode = newNode as Node<FeatureNodeData>;
					setNodes(
						nodes.map((node) =>
							node.id === updatedNode.id ? updatedNode : node
						)
					);
				},
			},
		},
	});

	useRegisterState({
		key: 'edges',
		value: edges,
		setValue: setEdges,
		description: 'Product roadmap edges',
	});

	// Register mention provider for nodes
	useStateBasedMentionProvider({
		stateKey: 'nodes',
		trigger: '@',
		labelField: (node: Node<FeatureNodeData>) => node.data.title,
		searchFields: ['data.description'],
		description: 'Product roadmap features',
		icon: <Box />,
		color: '#3B82F6', // Blue color
	});

	// Register mention provider for edges
	useStateBasedMentionProvider({
		stateKey: 'edges',
		trigger: '@',
		labelField: (edge: Edge) => {
			const sourceNode = nodes.find((n) => n.id === edge.source);
			const targetNode = nodes.find((n) => n.id === edge.target);
			const sourceTitle = sourceNode?.data.title || edge.source;
			const targetTitle = targetNode?.data.title || edge.target;
			return `${sourceTitle} → ${targetTitle}`;
		},
		description: 'Product roadmap connections',
		icon: <ArrowRight />,
		color: '#10B981', // Green color
	});

	// Fetch initial data
	React.useEffect(() => {
		getNodes().then(setNodes);
		getEdges().then(setEdges);
	}, [setNodes, setEdges]);

	// Custom handler for node changes that intercepts deletions
	const handleNodesChange = React.useCallback(
		async (changes: any[]) => {
			// Check if any changes are deletions
			const deletions = changes.filter((change) => change.type === 'remove');

			if (deletions.length > 0) {
				// Perform soft delete for each deleted node
				for (const deletion of deletions) {
					await deleteNode(deletion.id);
				}

				// Remove edges connected to deleted nodes
				setEdges((edges) => {
					const deletedIds = deletions.map((d) => d.id);
					return edges.filter(
						(edge) =>
							!deletedIds.includes(edge.source) &&
							!deletedIds.includes(edge.target)
					);
				});
			}

			// Apply all changes (including deletions) to local state
			onNodesChange(changes);
		},
		[onNodesChange, setEdges]
	);

	// Persist changes with loading/saved indicator (debounced)
	React.useEffect(() => {
		if (initialMount.current) {
			initialMount.current = false;
			return;
		}
		if (saveTimeout.current) {
			clearTimeout(saveTimeout.current);
		}
		saveTimeout.current = setTimeout(() => {
			setIsSaving(true);
			Promise.all([saveNodes(nodes), saveEdges(edges)])
				.then(() => {
					setIsSaving(false);
					setHasSaved(true);
				})
				.catch(() => setIsSaving(false));
		}, 1000);
		return () => {
			if (saveTimeout.current) {
				clearTimeout(saveTimeout.current);
			}
		};
	}, [nodes, edges]);

	const onConnect = React.useCallback(
		(params: Connection) => {
			setEdges((eds) =>
				addEdge({ ...params, type: 'simplebezier', animated: true }, eds)
			);
		},
		[setEdges]
	);

	// Prevent node drag/pan selection interfering (optional)
	const onNodeClick = React.useCallback(
		(_event: React.MouseEvent, node: Node) => {
			console.log('📌 Node clicked', node);
		},
		[]
	);

	return (
		<div className='h-full w-full relative'>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onNodesChange={handleNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onNodeClick={onNodeClick}
				connectionLineType={ConnectionLineType.SmoothStep}
				defaultEdgeOptions={{
					type: 'simplebezier',
					animated: true,
					markerEnd: { type: MarkerType.ArrowClosed },
				}}
				fitView>
				<Background gap={16} size={1} />
				<Controls />
				<ChatInput
					position='bottom-center'
					handleFocus={() => {}}
					handleBlur={() => {}}
					isInputFocused={false}
				/>
			</ReactFlow>
			<div className='absolute top-4 right-4 z-20'>
				{isSaving ? (
					<motion.div
						animate={{ rotate: 360 }}
						transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
						<Loader size={20} className='text-gray-500' />
					</motion.div>
				) : hasSaved ? (
					<CheckCircle size={20} className='text-green-500' />
				) : null}
			</div>
		</div>
	);
}

// -----------------------------------------------------------------------------
// Selected Nodes panel (shows titles of selected nodes)
// -----------------------------------------------------------------------------

function SelectedNodesPanel() {
	const [selected, setSelected] = React.useState<Node<FeatureNodeData>[]>([]);

	// whenever `selected` changes, it'll be merged into store.additionalContext
	// Update to use 'nodes' key to match what mention provider uses
	subscribeInputContext(
		selected,
		(nodes: Node<FeatureNodeData>[]) => ({
			selectedNodes: nodes,
		}),
		{
			icon: <Box />,
			color: '#8B5CF6', // Purple color for selected nodes
		}
	);

	useOnSelectionChange({
		onChange: ({ nodes }: { nodes: Node<FeatureNodeData>[] }) =>
			setSelected(nodes),
	});

	return (
		<div className='absolute right-4 top-4 rounded-lg p-3 shadow-md backdrop-blur'>
			<h4 className='mb-2 text-sm font-semibold'>Selected Nodes</h4>
			{selected.length ? (
				<ul className='space-y-1 text-xs'>
					{selected.map((n) => (
						<li key={n.id}>{n.data.title || n.id}</li>
					))}
				</ul>
			) : (
				<p className='text-[11px] text-gray-500'>No selection</p>
			)}
		</div>
	);
}

// -----------------------------------------------------------------------------
// Page component with provider wrapper
// -----------------------------------------------------------------------------

export default function ProductMapPage() {
	return (
		<ReactFlowProvider>
			<div className='relative h-screen w-full'>
				<FlowCanvas />
				<SelectedNodesPanel />
			</div>
		</ReactFlowProvider>
	);
}
