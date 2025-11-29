"""
Multi-Agent Orchestrator - Parallel task execution with multiple agents
"""
import json
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Optional
from agent import AgentWorker


@dataclass
class OrchestratorResult:
    status: str
    task: str
    subtasks: list
    results: list
    summary: Optional[str] = None
    total_time: float = 0.0
    total_iterations: int = 0


class MultiAgentOrchestrator:
    """Orchestrates multiple agents to solve complex tasks in parallel"""

    def __init__(self, max_workers: int = 5, model: str = "ai/llama3.2"):
        self.max_workers = max_workers
        self.model = model
        self.model_url = "http://127.0.0.1:12434/engines/llama.cpp/v1/chat/completions"

    def _query_llm(self, prompt: str, system: str = "") -> str:
        """Query LLM for task decomposition"""
        try:
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})

            response = requests.post(
                self.model_url,
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": 500,
                    "temperature": 0.2
                },
                timeout=30
            )
            return response.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            return f"Error: {str(e)}"

    def decompose_task(self, task: str) -> list[str]:
        """Break a complex task into parallelizable subtasks"""
        system = """You decompose complex tasks into independent subtasks that can run in parallel.

Rules:
1. Each subtask should be self-contained and independent
2. Output ONLY a JSON array of subtask strings
3. Keep subtasks focused and specific
4. If the task is simple, return a single-item array
5. Maximum 5 subtasks

Example output:
["Check git status of repo A", "List files in directory B", "Get kubernetes pod status"]"""

        prompt = f"Decompose this task into parallel subtasks:\n\n{task}"
        response = self._query_llm(prompt, system)

        # Parse JSON array from response
        try:
            # Handle markdown code blocks
            if "```" in response:
                response = response.split("```")[1]
                if response.startswith("json"):
                    response = response[4:]
            response = response.strip()
            subtasks = json.loads(response)
            if isinstance(subtasks, list):
                return subtasks[:self.max_workers]  # Limit to max workers
        except:
            pass

        # Fallback: treat original task as single subtask
        return [task]

    def summarize_results(self, task: str, results: list) -> str:
        """Aggregate agent results into a unified summary"""
        results_text = "\n\n".join([
            f"Subtask {i+1}: {r.get('answer', r.get('result', 'No result'))}"
            for i, r in enumerate(results)
        ])

        system = """You summarize multiple agent results into a coherent response.
Be concise but complete. Highlight key findings and any issues."""

        prompt = f"""Original task: {task}

Agent results:
{results_text}

Provide a unified summary of the findings."""

        return self._query_llm(prompt, system)

    def execute_parallel(self, subtasks: list[str]) -> list:
        """Run agents in parallel for each subtask"""
        results = []

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_task = {
                executor.submit(self._run_agent, i, task): (i, task)
                for i, task in enumerate(subtasks)
            }

            for future in as_completed(future_to_task):
                idx, task = future_to_task[future]
                try:
                    result = future.result()
                    results.append((idx, result))
                except Exception as e:
                    results.append((idx, {
                        "status": "error",
                        "answer": f"Agent error: {str(e)}",
                        "iterations": 0
                    }))

        # Sort by original index
        results.sort(key=lambda x: x[0])
        return [r[1] for r in results]

    def _run_agent(self, agent_id: int, task: str) -> dict:
        """Run a single agent"""
        agent = AgentWorker(f"agent-{agent_id}", self.model)
        return agent.run(task)

    def run(self, task: str, summarize: bool = True) -> OrchestratorResult:
        """Execute a complex task with multiple parallel agents"""
        start_time = time.time()

        # Decompose task
        print(f"[Orchestrator] Analyzing task...")
        subtasks = self.decompose_task(task)
        print(f"[Orchestrator] Decomposed into {len(subtasks)} subtasks:")
        for i, st in enumerate(subtasks):
            print(f"  {i+1}. {st}")

        # Execute in parallel
        print(f"\n[Orchestrator] Launching {len(subtasks)} agents in parallel...")
        results = self.execute_parallel(subtasks)

        # Calculate totals
        total_iterations = sum(r.get('iterations', 0) for r in results)
        total_time = time.time() - start_time

        # Print individual results
        for i, (st, result) in enumerate(zip(subtasks, results)):
            status = result.get('status', 'unknown')
            status_icon = "✓" if status == "complete" else "✗"
            print(f"\n[Agent {i}] {status_icon} {st}")
            print(f"  Status: {status} | Iterations: {result.get('iterations', 0)}")
            answer = result.get('answer', result.get('result', ''))
            if answer:
                # Truncate long results
                result_preview = answer[:200] + "..." if len(answer) > 200 else answer
                print(f"  Result: {result_preview}")

        # Summarize
        summary = None
        if summarize and len(results) > 1:
            print(f"\n[Orchestrator] Generating summary...")
            summary = self.summarize_results(task, results)

        return OrchestratorResult(
            status="complete" if all(r.get('status') == "complete" for r in results) else "partial",
            task=task,
            subtasks=subtasks,
            results=results,
            summary=summary,
            total_time=total_time,
            total_iterations=total_iterations
        )


if __name__ == "__main__":
    import sys

    orchestrator = MultiAgentOrchestrator(max_workers=3)

    if len(sys.argv) > 1:
        task = " ".join(sys.argv[1:])
    else:
        task = "List files in C:/Users/scarm/ai_cli and check docker status"

    print("=" * 60)
    print("MULTI-AGENT ORCHESTRATOR")
    print("=" * 60)
    print(f"Task: {task}")
    print("=" * 60)

    result = orchestrator.run(task)

    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    print(f"Status: {result.status}")
    print(f"Total Time: {result.total_time:.2f}s")
    print(f"Total Iterations: {result.total_iterations}")

    if result.summary:
        print(f"\n--- Summary ---\n{result.summary}")
