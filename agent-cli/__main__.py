#!/usr/bin/env python3
"""
Multi-Agent AI CLI - Entry Point
Execute complex tasks with parallel autonomous agents
"""
import sys
import json
import argparse
from orchestrator import MultiAgentOrchestrator
from agent import AgentWorker


def main():
    parser = argparse.ArgumentParser(
        description="Multi-Agent AI CLI - Execute tasks with autonomous agents",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m ai_cli "List files in current directory"
  python -m ai_cli --parallel "Check git status and list docker containers"
  python -m ai_cli --single "What time is it?"
  python -m ai_cli --workers 5 "Analyze all repos in C:/Users/scarm/projects"
"""
    )
    parser.add_argument("task", nargs="?", help="Task to execute")
    parser.add_argument("--single", "-s", action="store_true",
                        help="Use single agent instead of orchestrator")
    parser.add_argument("--parallel", "-p", action="store_true",
                        help="Force parallel execution with task decomposition")
    parser.add_argument("--workers", "-w", type=int, default=3,
                        help="Max parallel workers (default: 3)")
    parser.add_argument("--model", "-m", default="ai/llama3.2",
                        help="Model to use (default: ai/llama3.2)")
    parser.add_argument("--json", "-j", action="store_true",
                        help="Output results as JSON")
    parser.add_argument("--no-summary", action="store_true",
                        help="Skip result summarization")
    parser.add_argument("--interactive", "-i", action="store_true",
                        help="Interactive mode")

    args = parser.parse_args()

    # Interactive mode
    if args.interactive or not args.task:
        interactive_mode(args)
        return

    # Execute task
    if args.single:
        result = run_single_agent(args.task, args.model)
    else:
        result = run_orchestrator(args.task, args.workers, args.model, not args.no_summary)

    # Output
    if args.json:
        print(json.dumps(result, indent=2, default=str))
    else:
        print_result(result, args.single)


def run_single_agent(task: str, model: str) -> dict:
    """Run task with single agent"""
    agent = AgentWorker("agent-0", model)
    return agent.run(task)


def run_orchestrator(task: str, workers: int, model: str, summarize: bool) -> dict:
    """Run task with multi-agent orchestrator"""
    orchestrator = MultiAgentOrchestrator(max_workers=workers, model=model)
    result = orchestrator.run(task, summarize=summarize)
    return {
        "status": result.status,
        "task": result.task,
        "subtasks": result.subtasks,
        "results": [
            {
                "status": r.status if hasattr(r, 'status') else r.get('status'),
                "result": r.result if hasattr(r, 'result') else r.get('answer'),
                "iterations": r.iterations if hasattr(r, 'iterations') else r.get('iterations')
            }
            for r in result.results
        ],
        "summary": result.summary,
        "total_time": result.total_time,
        "total_iterations": result.total_iterations
    }


def print_result(result: dict, single: bool):
    """Pretty print results"""
    print("\n" + "=" * 60)
    print("RESULT")
    print("=" * 60)

    if single:
        print(f"Status: {result.get('status')}")
        print(f"Iterations: {result.get('iterations')}")
        if result.get('answer'):
            print(f"\nAnswer:\n{result['answer']}")
    else:
        print(f"Status: {result.get('status')}")
        print(f"Time: {result.get('total_time', 0):.2f}s")
        print(f"Total Iterations: {result.get('total_iterations')}")

        if result.get('subtasks'):
            print(f"\nSubtasks ({len(result['subtasks'])}):")
            for i, st in enumerate(result['subtasks']):
                r = result['results'][i] if i < len(result.get('results', [])) else {}
                status_icon = "✓" if r.get('status') == 'complete' else "✗"
                print(f"  {status_icon} {st}")

        if result.get('summary'):
            print(f"\nSummary:\n{result['summary']}")


def interactive_mode(args):
    """Interactive REPL mode"""
    print("=" * 60)
    print("Multi-Agent AI CLI - Interactive Mode")
    print("=" * 60)
    print("Commands:")
    print("  /single  - Toggle single agent mode")
    print("  /workers N - Set number of workers")
    print("  /model NAME - Set model")
    print("  /quit    - Exit")
    print("=" * 60)

    single_mode = args.single
    workers = args.workers
    model = args.model

    while True:
        try:
            task = input("\n> ").strip()

            if not task:
                continue

            if task.startswith("/"):
                cmd = task.lower().split()
                if cmd[0] == "/quit" or cmd[0] == "/exit":
                    print("Goodbye!")
                    break
                elif cmd[0] == "/single":
                    single_mode = not single_mode
                    print(f"Single agent mode: {'ON' if single_mode else 'OFF'}")
                elif cmd[0] == "/workers" and len(cmd) > 1:
                    workers = int(cmd[1])
                    print(f"Workers set to: {workers}")
                elif cmd[0] == "/model" and len(cmd) > 1:
                    model = cmd[1]
                    print(f"Model set to: {model}")
                else:
                    print(f"Unknown command: {cmd[0]}")
                continue

            # Execute task
            if single_mode:
                result = run_single_agent(task, model)
            else:
                result = run_orchestrator(task, workers, model, True)

            print_result(result, single_mode)

        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    main()
