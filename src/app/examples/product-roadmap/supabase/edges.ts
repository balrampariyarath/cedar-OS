import { supabase } from './client';
import type { Edge, EdgeMarkerType } from 'reactflow';

// Defines how edges are stored in the database
type EdgeRow = {
	id: string;
	source: string;
	source_handle: string | null;
	target: string;
	target_handle: string | null;
	type: string;
	animated: boolean;
	marker_end: EdgeMarkerType;
};

// Fetch edges from Supabase and map to ReactFlow Edge type
export async function getEdges(): Promise<Edge[]> {
	const { data, error } = await supabase.from('edges').select('*');
	if (error) throw error;
	const rows = data as EdgeRow[];
	return rows.map((row) => ({
		id: row.id,
		source: row.source,
		sourceHandle: row.source_handle,
		target: row.target,
		targetHandle: row.target_handle,
		type: row.type,
		animated: row.animated,
		markerEnd: row.marker_end as EdgeMarkerType,
	}));
}

// Save edges back to Supabase
export async function saveEdges(edges: Edge[]) {
	const rows: EdgeRow[] = edges.map((e) => ({
		id: e.id,
		source: e.source,
		source_handle: e.sourceHandle ?? null,
		target: e.target,
		target_handle: e.targetHandle ?? null,
		type: e.type!,
		animated: e.animated!,
		marker_end: e.markerEnd as EdgeMarkerType,
	}));
	const { error } = await supabase.from('edges').upsert(rows);
	if (error) throw error;
}
