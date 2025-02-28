// Mock response for Claude AI message
export const mockAnthropicSearchResponse = {
  id: 'msg_01234567890',
  model: 'claude-3-7-sonnet-202502199',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: `{
  "textSearch": ["italian", "restaurant"],
  "categories": ["italian"],
  "visited": false,
  "useProximity": true,
  "location": {
    "near": [-122.4194, 37.7749],
    "maxDistance": 2000
  }
}`,
    },
  ],
  stop_reason: 'end_turn',
  usage: {
    input_tokens: 512,
    output_tokens: 128,
  },
};
