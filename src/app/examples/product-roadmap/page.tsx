'use client';

import React from 'react';
import ReactFlow, {
	Background,
	Controls,
	Edge,
	Node,
	NodeTypes,
	MarkerType,
	addEdge,
	applyNodeChanges,
	applyEdgeChanges,
	Connection,
	EdgeChange,
	NodeChange,
	ConnectionLineType,
	ReactFlowProvider,
	useOnSelectionChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { FeatureNode, FeatureNodeData } from './components/FeatureNode';

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
			upvotes: 42,
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
			upvotes: 30,
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
			upvotes: 58,
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
	// React Flow handlers & state -------------------------------------------------
	const [nodes, setNodes] =
		React.useState<Node<FeatureNodeData>[]>(initialNodes);
	const [edges, setEdges] = React.useState<Edge[]>(initialEdges);

	const onNodesChange = React.useCallback(
		(changes: NodeChange[]) =>
			setNodes((nds) => applyNodeChanges(changes, nds)),
		[]
	);

	const onEdgesChange = React.useCallback(
		(changes: EdgeChange[]) =>
			setEdges((eds) => applyEdgeChanges(changes, eds)),
		[]
	);

	const onConnect = React.useCallback(
		(params: Connection) =>
			setEdges((eds) =>
				addEdge({ ...params, type: 'simplebezier', animated: true }, eds)
			),
		[]
	);

	// Prevent node drag/pan selection interfering (optional)
	const onNodeClick = React.useCallback(
		(_event: React.MouseEvent, node: Node) => {
			console.log('📌 Node clicked', node);
		},
		[]
	);

	return (
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
		</ReactFlow>
	);
}

// -----------------------------------------------------------------------------
// Selected Nodes panel (shows titles of selected nodes)
// -----------------------------------------------------------------------------

function SelectedNodesPanel() {
	const [selected, setSelected] = React.useState<Node<FeatureNodeData>[]>([]);

	useOnSelectionChange({
		onChange: ({ nodes }) => setSelected(nodes as Node<FeatureNodeData>[]),
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
