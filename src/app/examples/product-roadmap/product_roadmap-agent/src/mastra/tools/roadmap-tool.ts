import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Define types for our roadmap features
interface Feature {
	id: string;
	title: string;
	description: string;
	status: 'done' | 'planned' | 'backlog' | 'in progress';
	nodeType: 'feature';
	upvotes: number;
	comments: Comment[];
}

interface Comment {
	id: string;
	content: string;
	author: string;
	createdAt: string;
}

// Add a new feature
export const addFeatureTool = createTool({
	id: 'add-feature',
	description: 'Add a new feature to the product roadmap',
	inputSchema: z.object({
		id: z.string().optional().describe('ID of the feature'),
		title: z.string().describe('Title of the feature'),
		description: z.string().describe('Description of the feature'),
		status: z
			.enum(['done', 'planned', 'backlog', 'in progress'])
			.default('planned')
			.describe('Status of the feature'),
		nodeType: z.literal('feature').default('feature'),
		upvotes: z.number().default(0),
		comments: z
			.array(
				z.object({
					id: z.string(),
					author: z.string(),
					text: z.string(),
				})
			)
			.default([]),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		feature: z.object({
			id: z.string(),
			title: z.string(),
			description: z.string(),
			status: z.string(),
			nodeType: z.string(),
			upvotes: z.number(),
			comments: z.array(
				z.object({
					id: z.string(),
					author: z.string(),
					text: z.string(),
				})
			),
		}),
	}),
	execute: async ({ context }) => {
		const feature = {
			id: context.id || '',
			title: context.title,
			description: context.description,
			status: context.status,
			nodeType: context.nodeType,
			upvotes: context.upvotes,
			comments: context.comments,
		};

		return {
			success: true,
			feature,
		};
	},
});

// Update a feature
export const updateFeatureTool = createTool({
	id: 'update-feature',
	description: 'Update an existing feature in the product roadmap',
	inputSchema: z.object({
		id: z.string().describe('ID of the feature to update'),
		title: z.string().optional().describe('New title of the feature'),
		description: z
			.string()
			.optional()
			.describe('New description of the feature'),
		status: z
			.enum(['done', 'planned', 'backlog', 'in progress'])
			.optional()
			.describe('New status of the feature'),
		upvotes: z.number().optional(),
		comments: z
			.array(
				z.object({
					id: z.string(),
					author: z.string(),
					text: z.string(),
				})
			)
			.optional(),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		feature: z.object({
			id: z.string(),
			title: z.string(),
			description: z.string(),
			status: z.string(),
			nodeType: z.string(),
			upvotes: z.number(),
			comments: z.array(
				z.object({
					id: z.string(),
					author: z.string(),
					text: z.string(),
				})
			),
		}),
	}),
	execute: async ({ context }) => {
		return {
			success: true,
			feature: {
				id: context.id,
				title: context.title || '',
				description: context.description || '',
				status: context.status || 'planned',
				nodeType: 'feature',
				upvotes: context.upvotes || 0,
				comments: context.comments || [],
			},
		};
	},
});

// Delete a feature
export const deleteFeatureTool = createTool({
	id: 'delete-feature',
	description: 'Delete a feature from the product roadmap',
	inputSchema: z.object({
		id: z.string().describe('ID of the feature to delete'),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		message: z.string(),
	}),
	execute: async ({ context }) => {
		return {
			success: true,
			message: `Feature ${context.id} deleted successfully`,
		};
	},
});

// Export all tools
export const roadmapTools = {
	addFeatureTool,
	updateFeatureTool,
	deleteFeatureTool,
};
