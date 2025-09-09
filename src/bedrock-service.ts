import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';

export class BedrockService {
  private client: BedrockRuntimeClient;

  constructor() {
    this.client = new BedrockRuntimeClient({ 
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  async *streamSummary(content: string): AsyncGenerator<string, void, unknown> {
    const prompt = `Analyze this PARA (Projects, Areas, Resources, Archives) knowledge management system and provide a comprehensive analysis including:

QUANTITATIVE ANALYSIS:
- Count and distribution of items across PARA buckets
- Relationship density and interconnectedness metrics
- Activity patterns and completion rates
- Resource utilization and allocation

QUALITATIVE ANALYSIS:
- System health and organizational effectiveness
- Workflow bottlenecks and optimization opportunities
- Knowledge gaps and redundancies
- Strategic alignment and priority assessment

ACTIONABLE INSIGHTS:
- Immediate action items requiring attention
- Long-term strategic recommendations
- Process improvements and best practices
- Risk areas and mitigation strategies

Please structure your analysis with clear sections, specific metrics, and actionable recommendations based on this PARA system data:

${content}`;
    
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }),
      contentType: 'application/json'
    });

    const response = await this.client.send(command);
    
    if (response.body) {
      for await (const chunk of response.body) {
        if (chunk.chunk?.bytes) {
          const text = new TextDecoder().decode(chunk.chunk.bytes);
          const parsed = JSON.parse(text);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            yield parsed.delta.text;
          }
        }
      }
    }
  }
}
