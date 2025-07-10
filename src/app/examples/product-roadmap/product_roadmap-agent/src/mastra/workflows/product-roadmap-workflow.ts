import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Define schemas for our feature data
const featureSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string(),
	status: z.enum(['planned', 'in-progress', 'completed', 'cancelled']),
	priority: z.enum(['low', 'medium', 'high', 'critical']),
	votes: z.number(),
	parentId: z.string().optional(),
});

const commentSchema = z.object({
	id: z.string(),
	content: z.string(),
	author: z.string(),
	createdAt: z.string(),
});

const featureDetailSchema = featureSchema.extend({
	comments: z.array(commentSchema),
	children: z.array(z.string()).optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

// Step to get all features with optional filtering
const getFeatures = createStep({
	id: 'get-features',
	description:
		'Gets all features from the product roadmap with optional filtering',
	inputSchema: z.object({
		status: z
			.enum(['planned', 'in-progress', 'completed', 'cancelled'])
			.optional(),
		priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
	}),
	outputSchema: z.object({
		features: z.array(featureSchema),
	}),
	execute: async ({ inputData, tools }) => {
		if (!tools?.getFeaturesTool) {
			throw new Error('Get features tool not available');
		}

		const result = await tools.getFeaturesTool({
			status: inputData?.status,
			priority: inputData?.priority,
		});

		return result;
	},
});

// Step to get details of a specific feature
const getFeatureDetails = createStep({
	id: 'get-feature-details',
	description: 'Gets detailed information about a specific feature',
	inputSchema: z.object({
		featureId: z.string(),
	}),
	outputSchema: z.object({
		feature: featureDetailSchema.nullable(),
	}),
	execute: async ({ inputData, tools }) => {
		if (!inputData?.featureId) {
			throw new Error('Feature ID is required');
		}

		if (!tools?.getFeatureDetailsTool) {
			throw new Error('Get feature details tool not available');
		}

		const result = await tools.getFeatureDetailsTool({
			featureId: inputData.featureId,
		});

		return result;
	},
});

// Step to add a new feature
const addFeature = createStep({
	id: 'add-feature',
	description: 'Adds a new feature to the product roadmap',
	inputSchema: z.object({
		title: z.string(),
		description: z.string(),
		status: z
			.enum(['planned', 'in-progress', 'completed', 'cancelled'])
			.default('planned'),
		priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
		parentId: z.string().optional(),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		feature: z.object({
			id: z.string(),
			title: z.string(),
			description: z.string(),
		}),
	}),
	execute: async ({ inputData, tools }) => {
		if (!inputData) {
			throw new Error('Input data is required');
		}

		if (!tools?.addFeatureTool) {
			throw new Error('Add feature tool not available');
		}

		const result = await tools.addFeatureTool({
			title: inputData.title,
			description: inputData.description,
			status: inputData.status,
			priority: inputData.priority,
			parentId: inputData.parentId,
		});

		return result;
	},
});

// Step to update an existing feature
const updateFeature = createStep({
	id: 'update-feature',
	description: 'Updates an existing feature in the product roadmap',
	inputSchema: z.object({
		featureId: z.string(),
		title: z.string().optional(),
		description: z.string().optional(),
		status: z
			.enum(['planned', 'in-progress', 'completed', 'cancelled'])
			.optional(),
		priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		message: z.string(),
	}),
	execute: async ({ inputData, tools }) => {
		if (!inputData?.featureId) {
			throw new Error('Feature ID is required');
		}

		if (!tools?.updateFeatureTool) {
			throw new Error('Update feature tool not available');
		}

		const result = await tools.updateFeatureTool({
			featureId: inputData.featureId,
			title: inputData.title,
			description: inputData.description,
			status: inputData.status,
			priority: inputData.priority,
		});

		return result;
	},
});

// Step to vote for a feature
const voteFeature = createStep({
	id: 'vote-feature',
	description: 'Adds a vote to a feature',
	inputSchema: z.object({
		featureId: z.string(),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		message: z.string(),
		votes: z.number(),
	}),
	execute: async ({ inputData, tools }) => {
		if (!inputData?.featureId) {
			throw new Error('Feature ID is required');
		}

		if (!tools?.voteFeatureTool) {
			throw new Error('Vote feature tool not available');
		}

		const result = await tools.voteFeatureTool({
			featureId: inputData.featureId,
		});

		return result;
	},
});

// Step to add a comment to a feature
const addComment = createStep({
	id: 'add-comment',
	description: 'Adds a comment to a feature',
	inputSchema: z.object({
		featureId: z.string(),
		content: z.string(),
		author: z.string(),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		message: z.string(),
		comment: commentSchema.optional(),
	}),
	execute: async ({ inputData, tools }) => {
		if (!inputData?.featureId || !inputData?.content || !inputData?.author) {
			throw new Error('Feature ID, content, and author are required');
		}

		if (!tools?.addCommentTool) {
			throw new Error('Add comment tool not available');
		}

		const result = await tools.addCommentTool({
			featureId: inputData.featureId,
			content: inputData.content,
			author: inputData.author,
		});

		return result;
	},
});

// Step to get the feature tree
const getFeatureTree = createStep({
	id: 'get-feature-tree',
	description: 'Gets the hierarchical tree of features',
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
	execute: async ({ tools }) => {
		if (!tools?.getFeatureTreeTool) {
			throw new Error('Get feature tree tool not available');
		}

		const result = await tools.getFeatureTreeTool({});
		return result;
	},
});

// Step to analyze roadmap and provide insights
const analyzeRoadmap = createStep({
	id: 'analyze-roadmap',
	description: 'Analyzes the roadmap and provides insights',
	inputSchema: z.object({}),
	outputSchema: z.object({
		insights: z.string(),
		completionPercentage: z.number(),
		topPriorityFeatures: z.array(featureSchema),
	}),
	execute: async ({ tools, mastra }) => {
		if (!tools?.getFeaturesTool) {
			throw new Error('Get features tool not available');
		}

		// Get all features
		const allFeaturesResult = await tools.getFeaturesTool({});
		const allFeatures = allFeaturesResult.features;

		// Get completed features
		const completedFeaturesResult = await tools.getFeaturesTool({
			status: 'completed',
		});
		const completedFeatures = completedFeaturesResult.features;

		// Get high priority features
		const highPriorityFeaturesResult = await tools.getFeaturesTool({
			priority: 'high',
		});
		const highPriorityFeatures = highPriorityFeaturesResult.features;

		// Get critical priority features
		const criticalPriorityFeaturesResult = await tools.getFeaturesTool({
			priority: 'critical',
		});
		const criticalPriorityFeatures = criticalPriorityFeaturesResult.features;

		// Calculate completion percentage
		const completionPercentage =
			allFeatures.length > 0
				? (completedFeatures.length / allFeatures.length) * 100
				: 0;

		// Combine high and critical priority features and sort by votes
		const topPriorityFeatures = [
			...highPriorityFeatures,
			...criticalPriorityFeatures,
		]
			.filter((f) => f.status !== 'completed' && f.status !== 'cancelled')
			.sort((a, b) => b.votes - a.votes)
			.slice(0, 5);

		// Generate insights using the agent
		const agent = mastra?.getAgent('productRoadmapAgent');
		if (!agent) {
			throw new Error('Product roadmap agent not found');
		}

		const prompt = `Based on the following roadmap data, provide insights about the current state of the project:
    
    Total features: ${allFeatures.length}
    Completed features: ${completedFeatures.length}
    Completion percentage: ${completionPercentage.toFixed(2)}%
    High priority features: ${highPriorityFeatures.length}
    Critical priority features: ${criticalPriorityFeatures.length}
    
    Top voted features that are not completed:
    ${topPriorityFeatures.map((f) => `- ${f.title} (${f.votes} votes, ${f.priority} priority, ${f.status})`).join('\n')}
    
    Please provide a concise analysis of the roadmap, focusing on:
    1. Overall project progress
    2. Key areas that need attention
    3. Recommendations for next steps
    
    Keep your response under 300 words.`;

		const response = await agent.chat([
			{
				role: 'user',
				content: prompt,
			},
		]);

		return {
			insights: response.text,
			completionPercentage,
			topPriorityFeatures,
		};
	},
});

// Create the main workflow
const productRoadmapWorkflow = createWorkflow({
	id: 'product-roadmap-workflow',
	inputSchema: z.object({
		action: z.enum([
			'get-features',
			'get-feature-details',
			'add-feature',
			'update-feature',
			'vote-feature',
			'add-comment',
			'get-feature-tree',
			'analyze-roadmap',
		]),
		params: z.record(z.any()),
	}),
	outputSchema: z.object({
		result: z.any(),
	}),
}).branch(
	({ inputData }) => {
		if (!inputData) throw new Error('Input data is required');
		return inputData.action;
	},
	{
		'get-features': createWorkflow({})
			.then(({ inputData }) =>
				getFeatures({
					status: inputData?.params?.status,
					priority: inputData?.params?.priority,
				})
			)
			.then((result) => ({ result })),

		'get-feature-details': createWorkflow({})
			.then(({ inputData }) =>
				getFeatureDetails({
					featureId: inputData?.params?.featureId,
				})
			)
			.then((result) => ({ result })),

		'add-feature': createWorkflow({})
			.then(({ inputData }) =>
				addFeature({
					title: inputData?.params?.title,
					description: inputData?.params?.description,
					status: inputData?.params?.status,
					priority: inputData?.params?.priority,
					parentId: inputData?.params?.parentId,
				})
			)
			.then((result) => ({ result })),

		'update-feature': createWorkflow({})
			.then(({ inputData }) =>
				updateFeature({
					featureId: inputData?.params?.featureId,
					title: inputData?.params?.title,
					description: inputData?.params?.description,
					status: inputData?.params?.status,
					priority: inputData?.params?.priority,
				})
			)
			.then((result) => ({ result })),

		'vote-feature': createWorkflow({})
			.then(({ inputData }) =>
				voteFeature({
					featureId: inputData?.params?.featureId,
				})
			)
			.then((result) => ({ result })),

		'add-comment': createWorkflow({})
			.then(({ inputData }) =>
				addComment({
					featureId: inputData?.params?.featureId,
					content: inputData?.params?.content,
					author: inputData?.params?.author,
				})
			)
			.then((result) => ({ result })),

		'get-feature-tree': createWorkflow({})
			.then(() => getFeatureTree({}))
			.then((result) => ({ result })),

		'analyze-roadmap': createWorkflow({})
			.then(() => analyzeRoadmap({}))
			.then((result) => ({ result })),
	}
);

productRoadmapWorkflow.commit();

export { productRoadmapWorkflow };
