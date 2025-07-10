# Cedar Product Roadmap Agent

This is an AI agent built with Mastra that helps manage and interact with the Cedar product roadmap. The agent provides a conversational interface for users to explore features, add new feature requests, vote on features, and get insights about the project's progress.

## Features

- View all features in the product roadmap
- Filter features by status (planned, in-progress, completed, cancelled)
- Filter features by priority (low, medium, high, critical)
- Get detailed information about specific features
- Add new feature requests
- Update existing features
- Vote on features
- Add comments to features
- View the hierarchical tree of features
- Get insights and analysis about the roadmap

## Getting Started

### Prerequisites

- Node.js v20.9.0 or higher

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Running the Agent

To start the agent in development mode:

```bash
npm run dev
```

To build the agent:

```bash
npm run build
```

To start the agent in production mode:

```bash
npm run start
```

## Usage

The agent can be interacted with through a conversational interface. Here are some example queries:

- "Show me all the features in the roadmap"
- "What are the high priority features?"
- "Tell me about the Zustand Store Integration feature"
- "I'd like to add a new feature request"
- "I want to vote for the AI Agent Integration feature"
- "Show me the feature hierarchy"
- "What's the current status of the project?"

## Architecture

The agent is built using Mastra, a framework for building AI agents. It consists of:

1. **Tools** - Functions that allow the agent to interact with the product roadmap data
2. **Agent** - The AI agent that uses the tools to respond to user queries
3. **Workflow** - A series of steps that define how the agent processes different types of requests

### Tools

- `getFeaturesTool` - Get all features with optional filtering
- `getFeatureDetailsTool` - Get detailed information about a specific feature
- `addFeatureTool` - Add a new feature
- `updateFeatureTool` - Update an existing feature
- `voteFeatureTool` - Vote for a feature
- `addCommentTool` - Add a comment to a feature
- `getFeatureTreeTool` - Get the hierarchical tree of features

### Workflow Steps

- `getFeatures` - Get features with optional filtering
- `getFeatureDetails` - Get details of a specific feature
- `addFeature` - Add a new feature
- `updateFeature` - Update an existing feature
- `voteFeature` - Vote for a feature
- `addComment` - Add a comment to a feature
- `getFeatureTree` - Get the feature tree
- `analyzeRoadmap` - Analyze the roadmap and provide insights

## License

ISC
