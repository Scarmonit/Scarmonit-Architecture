"""
smollm2_patch.py - Claude Code CLI contribution for smollm2 compatibility
Run this script to patch agent.py with smollm2 code block extraction fix.

The smollm2 model wraps TOOL/ARGS inside markdown code blocks like:
```
TOOL: run_command
ARGS: {"command": "echo hello"}
```

This patch adds extraction logic to handle that pattern.
"""
import re

def extract_from_code_blocks(response: str) -> str:
    """
    Extract TOOL/ARGS from markdown code blocks if present.
    This helps smollm2 which wraps everything in ``` blocks.
    """
    # Look for TOOL: inside a code block
    code_block_match = re.search(r'```(?:\w+)?\s*(TOOL:.*?)```', response, re.DOTALL)
    if code_block_match:
        return code_block_match.group(1).strip()
    return response


def patch_agent_parse_response():
    """
    Patch the parse_response method in agent.py to handle code blocks.
    """
    with open('agent.py', 'r') as f:
        content = f.read()

    # Check if already patched
    if 'extract_from_code_blocks' in content:
        print("Already patched!")
        return False

    # Check if 'import re' already exists
    if 'import re' not in content:
        content = content.replace(
            'import json',
            'import json\nimport re'
        )

    # Add code block extraction at start of parse_response
    old_parse = '''    def parse_response(self, response: str) -> dict:
        """Parse agent response for tool calls or final answer"""
        response = response.strip()'''

    new_parse = '''    def parse_response(self, response: str) -> dict:
        """Parse agent response for tool calls or final answer"""
        response = response.strip()

        # Extract TOOL/ARGS from code blocks (helps smollm2)
        code_block_match = re.search(r'```(?:\\w+)?\\s*(TOOL:.*?)```', response, re.DOTALL)
        if code_block_match:
            response = code_block_match.group(1).strip()'''

    if old_parse in content:
        content = content.replace(old_parse, new_parse)
        with open('agent.py', 'w') as f:
            f.write(content)
        print("Patched successfully!")
        return True
    else:
        print("Could not find expected code pattern to patch")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("smollm2 Code Block Extraction Patch")
    print("from Claude Code CLI")
    print("=" * 50)

    # Test the extraction function
    test_response = """To use the run_command tool...
```
TOOL: run_command
ARGS: {"command": "echo hello"}
```
This will print hello."""

    extracted = extract_from_code_blocks(test_response)
    print(f"\nTest extraction:")
    print(f"Input: {test_response[:50]}...")
    print(f"Output: {extracted}")

    print("\nTo apply patch, run: python smollm2_patch.py --apply")

    import sys
    if '--apply' in sys.argv:
        patch_agent_parse_response()
