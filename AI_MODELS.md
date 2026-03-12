# AI Model Configuration

The application supports both Anthropic (Claude) and OpenAI models for generating personalized letters and stories.

## Environment Variables

### Primary Provider: Anthropic
- `ANTHROPIC_API_KEY`: Your Anthropic API key (required for Claude models)
- `ANTHROPIC_MODEL`: Specify which Claude model to use (optional)

### Fallback Provider: OpenAI
- `OPENAI_API_KEY`: Your OpenAI API key (used as fallback or primary if no Anthropic key)
- `OPENAI_MODEL`: Specify which GPT model to use (optional)

## Available Models

### Anthropic Models (Best for Creative Writing)

| Model | Environment Value | Description | Best For |
|-------|------------------|-------------|----------|
| Claude 3.5 Sonnet | `claude-3-5-sonnet-20241022` | **Default**. Latest and best for creative writing | High-quality letters with nuance and creativity |
| Claude 3.5 Haiku | `claude-3-5-haiku-20241022` | Faster and cheaper, still excellent | Quick generation with good quality |
| Claude 3 Opus | `claude-3-opus-20240229` | Previous flagship, very capable | Alternative if Sonnet has issues |

### OpenAI Models (Fallback or Alternative)

| Model | Environment Value | Description | Best For |
|-------|------------------|-------------|----------|
| GPT-4o | `gpt-4o` | **Default**. Best OpenAI model (May 2024) | Excellent creative writing |
| GPT-4o Mini | `gpt-4o-mini` | Faster, cheaper version of GPT-4o | Quick generation, lower cost |
| GPT-4 Turbo | `gpt-4-turbo` | Stable, very capable | Reliable high-quality output |
| GPT-4 Turbo Preview | `gpt-4-turbo-preview` | Preview version | Testing new features |
| GPT-4 | `gpt-4` | Original GPT-4 | Proven reliability |

## Configuration Examples

### Use Claude 3.5 Haiku for faster generation:
```bash
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
```

### Use GPT-4o Mini for cost-effective OpenAI:
```bash
OPENAI_MODEL=gpt-4o-mini
```

### Force OpenAI as primary (don't set ANTHROPIC_API_KEY):
```bash
# Don't set ANTHROPIC_API_KEY
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

## Model Selection Logic

1. **If ANTHROPIC_API_KEY is set**:
   - Uses Anthropic with specified model (or claude-3-5-sonnet by default)
   - If Anthropic fails, automatically falls back to OpenAI

2. **If only OPENAI_API_KEY is set**:
   - Uses OpenAI with specified model (or gpt-4o by default)

3. **If both are set**:
   - Tries Anthropic first
   - Falls back to OpenAI if Anthropic fails

## Performance Comparison

### Generation Speed (fastest to slowest)
1. Claude 3.5 Haiku
2. GPT-4o Mini
3. Claude 3.5 Sonnet
4. GPT-4o
5. GPT-4 Turbo
6. Claude 3 Opus
7. GPT-4

### Creative Quality (best to good)
1. Claude 3.5 Sonnet ⭐
2. Claude 3 Opus
3. GPT-4o
4. GPT-4 Turbo
5. Claude 3.5 Haiku
6. GPT-4
7. GPT-4o Mini

### Cost Efficiency (cheapest to most expensive)
1. Claude 3.5 Haiku
2. GPT-4o Mini
3. Claude 3.5 Sonnet
4. GPT-4o
5. GPT-4 Turbo
6. Claude 3 Opus
7. GPT-4

## Recommendations

- **For best quality**: Use Claude 3.5 Sonnet (default)
- **For faster generation**: Use Claude 3.5 Haiku or GPT-4o Mini
- **For cost savings**: Use Claude 3.5 Haiku or GPT-4o Mini
- **For reliability**: Have both API keys configured for automatic fallback

## Temperature Settings

The system uses optimized temperature settings:
- Anthropic models: 0.9 (balanced creativity)
- OpenAI models: 0.95 (slightly higher for more creativity)

These are tuned for creative writing tasks and cannot be configured via environment variables.