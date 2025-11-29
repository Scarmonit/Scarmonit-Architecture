import argparse
import json
import sys
import requests
from agent import AgentWorker

def get_available_models():
    try:
        response = requests.get("http://127.0.0.1:12434/engines/llama.cpp/v1/models", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return [m["id"] for m in data.get("data", [])]
    except Exception as e:
        print(f"Error fetching models: {e}")
    return []

def verify_model(model_name):
    print(f"\nTesting model: {model_name}...")
    agent = AgentWorker(f"tester-{model_name.split(':')[0].split('/')[-1]}", model=model_name)
    # Simple task that requires a tool
    task = "Use the run_command tool to print 'Hello from agent'"
    
    # Reduce max iterations for quick testing
    agent.max_iterations = 3
    result = agent.run(task)
    
    success = False
    if result['status'] == 'complete':
        # Check if tool was actually used in history
        for item in agent.history:
            if item['parsed']['type'] == 'tool' and item['parsed']['tool'] == 'run_command':
                success = True
                break
    
    print(f"Result: {'PASS' if success else 'FAIL'}")
    return success

if __name__ == "__main__":
    models = get_available_models()
    if not models:
        print("No models found.")
        sys.exit(1)
        
    print(f"Found {len(models)} models: {models}")
    
    results = {}
    for model in models:
        results[model] = verify_model(model)
        
    print("\nSummary:")
    for model, status in results.items():
        print(f"{model}: {'✅ PASS' if status else '❌ FAIL'}")
