import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Define types for our roadmap features
interface Feature {
	id: string;
	title: string;
	description: string;
	status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
	priority: 'low' | 'medium' | 'high' | 'critical';
	votes: number;
	comments: Comment[];
	parentId?: string;
	children?: string[];
	createdAt: string;
	updatedAt: string;
}

interface Comment {
	id: string;
	content: string;
	author: string;
	createdAt: string;
}

// Mock database for features
const features: Record<string, Feature> = {
	'feature-1': {
		id: 'feature-1',
		title: 'Zustand Store Integration',
		description:
			'Integrate Zustand for state management across the Cedar application',
		status: 'completed',
		priority: 'high',
		votes: 42,
		comments: [
			{
				id: 'comment-1',
				content: 'This has been a game changer for our state management',
				author: 'user123',
				createdAt: '2023-10-15T10:30:00Z',
			},
		],
		children: ['feature-3', 'feature-4'],
		createdAt: '2023-09-01T00:00:00Z',
		updatedAt: '2023-10-20T00:00:00Z',
	},
	'feature-2': {
		id: 'feature-2',
		title: 'Chat Component Redesign',
		description: 'Redesign the chat interface for better user experience',
		status: 'in-progress',
		priority: 'medium',
		votes: 28,
		comments: [],
		children: ['feature-5'],
		createdAt: '2023-09-15T00:00:00Z',
		updatedAt: '2023-11-01T00:00:00Z',
	},
	'feature-3': {
		id: 'feature-3',
		title: 'Custom Hooks for Store Access',
		description: 'Create custom hooks for accessing the Zustand store',
		status: 'completed',
		priority: 'medium',
		votes: 15,
		comments: [],
		parentId: 'feature-1',
		createdAt: '2023-09-10T00:00:00Z',
		updatedAt: '2023-10-25T00:00:00Z',
	},
	'feature-4': {
		id: 'feature-4',
		title: 'Type Definitions for Store',
		description: 'Add comprehensive TypeScript definitions for the store',
		status: 'completed',
		priority: 'high',
		votes: 32,
		comments: [],
		parentId: 'feature-1',
		createdAt: '2023-09-12T00:00:00Z',
		updatedAt: '2023-10-22T00:00:00Z',
	},
	'feature-5': {
		id: 'feature-5',
		title: 'Responsive Chat Layout',
		description: 'Make chat component fully responsive across all devices',
		status: 'planned',
		priority: 'high',
		votes: 18,
		comments: [],
		parentId: 'feature-2',
		createdAt: '2023-10-01T00:00:00Z',
		updatedAt: '2023-10-01T00:00:00Z',
	},
	'feature-6': {
		id: 'feature-6',
		title: 'AI Agent Integration',
		description: 'Integrate AI agents for automated assistance',
		status: 'planned',
		priority: 'critical',
		votes: 56,
		comments: [
			{
				id: 'comment-2',
				content: 'This would be a huge productivity boost',
				author: 'user456',
				createdAt: '2023-11-05T14:22:00Z',
			},
		],
		createdAt: '2023-10-15T00:00:00Z',
		updatedAt: '2023-11-05T00:00:00Z',
	},
};

// Get all features
export const getFeaturesTool = createTool({
	id: 'get-features',
	description: 'Get all features in the product roadmap',
	inputSchema: z.object({
		status: z
			.enum(['planned', 'in-progress', 'completed', 'cancelled'])
			.optional()
			.describe('Filter features by status'),
		priority: z
			.enum(['low', 'medium', 'high', 'critical'])
			.optional()
			.describe('Filter features by priority'),
	}),
	outputSchema: z.object({
		features: z.array(
			z.object({
				id: z.string(),
				title: z.string(),
				description: z.string(),
				status: z.enum(['planned', 'in-progress', 'completed', 'cancelled']),
				priority: z.enum(['low', 'medium', 'high', 'critical']),
				votes: z.number(),
				parentId: z.string().optional(),
			})
		),
	}),
	execute: async ({ context }) => {
		let filteredFeatures = Object.values(features);

		if (context.status) {
			filteredFeatures = filteredFeatures.filter(
				(f) => f.status === context.status
			);
		}

		if (context.priority) {
			filteredFeatures = filteredFeatures.filter(
				(f) => f.priority === context.priority
			);
		}

		return {
			features: filteredFeatures.map((f) => ({
				id: f.id,
				title: f.title,
				description: f.description,
				status: f.status,
				priority: f.priority,
				votes: f.votes,
				parentId: f.parentId,
			})),
		};
	},
});

// Get a specific feature
export const getFeatureDetailsTool = createTool({
	id: 'get-feature-details',
	description: 'Get detailed information about a specific feature',
	inputSchema: z.object({
		featureId: z.string().describe('ID of the feature to retrieve'),
	}),
	outputSchema: z.object({
		feature: z
			.object({
				id: z.string(),
				title: z.string(),
				description: z.string(),
				status: z.enum(['planned', 'in-progress', 'completed', 'cancelled']),
				priority: z.enum(['low', 'medium', 'high', 'critical']),
				votes: z.number(),
				comments: z.array(
					z.object({
						id: z.string(),
						content: z.string(),
						author: z.string(),
						createdAt: z.string(),
					})
				),
				parentId: z.string().optional(),
				children: z.array(z.string()).optional(),
				createdAt: z.string(),
				updatedAt: z.string(),
			})
			.nullable(),
	}),
	execute: async ({ context }) => {
		const feature = features[context.featureId];

		if (!feature) {
			return { feature: null };
		}

		return { feature };
	},
});

// Add a new feature
export const addFeatureTool = createTool({
	id: 'add-feature',
	description: 'Add a new feature to the product roadmap',
	inputSchema: z.object({
		title: z.string().describe('Title of the feature'),
		description: z.string().describe('Description of the feature'),
		status: z
			.enum(['planned', 'in-progress', 'completed', 'cancelled'])
			.default('planned')
			.describe('Status of the feature'),
		priority: z
			.enum(['low', 'medium', 'high', 'critical'])
			.default('medium')
			.describe('Priority of the feature'),
		parentId: z
			.string()
			.optional()
			.describe('ID of the parent feature if this is a sub-feature'),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		feature: z.object({
			id: z.string(),
			title: z.string(),
			description: z.string(),
		}),
	}),
	execute: async ({ context }) => {
		const id = `feature-${Object.keys(features).length + 1}`;
		const now = new Date().toISOString();

		const newFeature: Feature = {
			id,
			title: context.title,
			description: context.description,
			status: context.status,
			priority: context.priority,
			votes: 0,
			comments: [],
			createdAt: now,
			updatedAt: now,
		};

		if (context.parentId) {
			const parentFeature = features[context.parentId];
			if (parentFeature) {
				newFeature.parentId = context.parentId;

				if (!parentFeature.children) {
					parentFeature.children = [];
				}
				parentFeature.children.push(id);
			}
		}

		features[id] = newFeature;

		return {
			success: true,
			feature: {
				id: newFeature.id,
				title: newFeature.title,
				description: newFeature.description,
			},
		};
	},
});

// Update a feature
export const updateFeatureTool = createTool({
	id: 'update-feature',
	description: 'Update an existing feature in the product roadmap',
	inputSchema: z.object({
		featureId: z.string().describe('ID of the feature to update'),
		title: z.string().optional().describe('New title of the feature'),
		description: z
			.string()
			.optional()
			.describe('New description of the feature'),
		status: z
			.enum(['planned', 'in-progress', 'completed', 'cancelled'])
			.optional()
			.describe('New status of the feature'),
		priority: z
			.enum(['low', 'medium', 'high', 'critical'])
			.optional()
			.describe('New priority of the feature'),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		message: z.string(),
	}),
	execute: async ({ context }) => {
		const feature = features[context.featureId];

		if (!feature) {
			return {
				success: false,
				message: `Feature with ID ${context.featureId} not found`,
			};
		}

		if (context.title) {
			feature.title = context.title;
		}

		if (context.description) {
			feature.description = context.description;
		}

		if (context.status) {
			feature.status = context.status;
		}

		if (context.priority) {
			feature.priority = context.priority;
		}

		feature.updatedAt = new Date().toISOString();

		return {
			success: true,
			message: `Feature ${context.featureId} updated successfully`,
		};
	},
});

// Vote for a feature
export const voteFeatureTool = createTool({
	id: 'vote-feature',
	description: 'Vote for a feature in the product roadmap',
	inputSchema: z.object({
		featureId: z.string().describe('ID of the feature to vote for'),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		message: z.string(),
		votes: z.number(),
	}),
	execute: async ({ context }) => {
		const feature = features[context.featureId];

		if (!feature) {
			return {
				success: false,
				message: `Feature with ID ${context.featureId} not found`,
				votes: 0,
			};
		}

		feature.votes += 1;

		return {
			success: true,
			message: `Vote added to feature ${context.featureId}`,
			votes: feature.votes,
		};
	},
});

// Add a comment to a feature
export const addCommentTool = createTool({
	id: 'add-comment',
	description: 'Add a comment to a feature in the product roadmap',
	inputSchema: z.object({
		featureId: z.string().describe('ID of the feature to comment on'),
		content: z.string().describe('Content of the comment'),
		author: z.string().describe('Author of the comment'),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		message: z.string(),
		comment: z
			.object({
				id: z.string(),
				content: z.string(),
				author: z.string(),
				createdAt: z.string(),
			})
			.optional(),
	}),
	execute: async ({ context }) => {
		const feature = features[context.featureId];

		if (!feature) {
			return {
				success: false,
				message: `Feature with ID ${context.featureId} not found`,
			};
		}

		const commentId = `comment-${feature.comments.length + 1}`;
		const now = new Date().toISOString();

		const newComment = {
			id: commentId,
			content: context.content,
			author: context.author,
			createdAt: now,
		};

		feature.comments.push(newComment);

		return {
			success: true,
			message: `Comment added to feature ${context.featureId}`,
			comment: newComment,
		};
	},
});

// Get feature tree
export const getFeatureTreeTool = createTool({
	id: 'get-feature-tree',
	description: 'Get the hierarchical tree of features',
	inputSchema: z.object({}),
	outputSchema: z.object({
		rootFeatures: z.array(
			z.object({
				id: z.string(),
				title: z.string(),
				status: z.enum(['planned', 'in-progress', 'completed', 'cancelled']),
				children: z.array(
					z.object({
						id: z.string(),
						title: z.string(),
						status: z.enum([
							'planned',
							'in-progress',
							'completed',
							'cancelled',
						]),
					})
				),
			})
		),
	}),
	execute: async () => {
		// Find root features (those without parentId)
		const rootFeatures = Object.values(features).filter((f) => !f.parentId);

		return {
			rootFeatures: rootFeatures.map((root) => ({
				id: root.id,
				title: root.title,
				status: root.status,
				children: (root.children || []).map((childId) => {
					const child = features[childId];
					return {
						id: child.id,
						title: child.title,
						status: child.status,
					};
				}),
			})),
		};
	},
});

// Export all tools
export const roadmapTools = {
	getFeaturesTool,
	getFeatureDetailsTool,
	addFeatureTool,
	updateFeatureTool,
	voteFeatureTool,
	addCommentTool,
	getFeatureTreeTool,
};
