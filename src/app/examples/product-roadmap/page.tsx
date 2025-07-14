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

import {
	FeatureNode,
	FeatureNodeData,
} from '@/app/examples/product-roadmap/components/FeatureNode';
import {
	getEdges,
	saveEdges,
} from '@/app/examples/product-roadmap/supabase/edges';
import {
	getNodes,
	saveNodes,
} from '@/app/examples/product-roadmap/supabase/nodes';
import { ChatInput, registerState } from 'cedar';
import { CheckCircle, Loader } from 'lucide-react';
import { motion } from 'motion/react';

// -----------------------------------------------------------------------------
// Sample data – replace with your own roadmap later
// -----------------------------------------------------------------------------

const initialNodes: Node<FeatureNodeData>[] = [
	{
		id: '1',
		type: 'featureNode',
		position: { x: 0, y: 50 },
		data: {
			title: 'User Authentication',
			description:
				'Enable users to sign up, sign in, and manage sessions securely.',
			upvotes: 0,
			comments: [],
			status: 'done',
		},
	},
	{
		id: '2',
		type: 'featureNode',
		position: { x: 300, y: 50 },
		data: {
			title: 'Team Workspaces',
			description: 'Allow users to collaborate by creating shared workspaces.',
			upvotes: 0,
			comments: [],
			status: 'planned',
		},
	},
	{
		id: '3',
		type: 'featureNode',
		position: { x: 600, y: 50 },
		data: {
			title: 'Mobile App',
			description: 'Native iOS & Android applications for on-the-go access.',
			upvotes: 0,
			comments: [],
			status: 'backlog',
		},
	},
];

const initialEdges: Edge[] = [
	{
		id: 'e1-2',
		source: '1',
		sourceHandle: 'right',
		target: '2',
		targetHandle: 'left',
		type: 'simplebezier',
		animated: true,
		markerEnd: {
			type: MarkerType.ArrowClosed,
		},
	},
	{
		id: 'e2-3',
		source: '2',
		sourceHandle: 'right',
		target: '3',
		targetHandle: 'left',
		type: 'simplebezier',
		animated: true,
		markerEnd: {
			type: MarkerType.ArrowClosed,
		},
	},
];

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
	// Controlled state for nodes & edges
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	// Saving/loading state
	const [isSaving, setIsSaving] = React.useState(false);
	const [hasSaved, setHasSaved] = React.useState(false);
	const initialMount = React.useRef(true);

	registerState({
		value: nodes,
		setValue: setNodes,
		key: 'nodes',
		description: 'Product roadmap nodes',
	});
	registerState({
		key: 'edges',
		value: edges,
		setValue: setEdges,
		description: 'Product roadmap edges',
	});

	// Fetch initial data
	React.useEffect(() => {
		getNodes().then(setNodes);
		getEdges().then(setEdges);
	}, [setNodes, setEdges]);

	// Persist changes with loading/saved indicator
	React.useEffect(() => {
		if (initialMount.current) {
			initialMount.current = false;
			return;
		}
		setIsSaving(true);
		Promise.all([saveNodes(nodes), saveEdges(edges)])
			.then(() => {
				setIsSaving(false);
				setHasSaved(true);
				// keep the saved check icon visible indefinitely
			})
			.catch(() => setIsSaving(false));
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
				onNodesChange={onNodesChange}
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
					mentionItems={nodes.map((node) => ({
						id: node.id,
						label: node.data.title,
					}))}
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
			<div className='relative h-[calc(100vh-60px)] w-full'>
				<FlowCanvas />
				<SelectedNodesPanel />
			</div>
		</ReactFlowProvider>
	);
}
