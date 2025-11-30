
import unittest
from unittest.mock import MagicMock, patch
from agent import AgentWorker

class TestAgentCritic(unittest.TestCase):
    def setUp(self):
        self.agent = AgentWorker("test-agent", critic_mode=True)
        self.agent.mcp = MagicMock()
        self.agent.log_to_dashboard = MagicMock()

    def test_critic_logic(self):
        # Directly mock query_llm to return specific sequence
        # Now we test that critic runs on iteration 0 as well.

        self.agent.query_llm = MagicMock(side_effect=[
            "TOOL: dangerous_tool\nARGS: {}",         # Call 1: Iteration 0 (Main) -> Flawed
            "TOOL: safe_tool\nARGS: {}",              # Call 2: Iteration 0 (Critic) -> Corrected
            "ANSWER: Done",                           # Call 3: Iteration 1 (Main) -> Answer
            "APPROVED"                                # Call 4: Iteration 1 (Critic) -> Approves Answer
        ])

        self.agent.execute_tool = MagicMock(return_value="Success")

        # Run
        result = self.agent.run("Test Task")

        # Assertions
        # 1. query_llm called 4 times
        self.assertEqual(self.agent.query_llm.call_count, 4)

        # 2. execute_tool called with safe_tool?
        #    - It 0: safe_tool (dangerous was rejected)
        calls = self.agent.execute_tool.call_args_list
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0][0][0], "safe_tool") # Should be safe_tool!

        self.assertEqual(result['status'], 'complete')

if __name__ == '__main__':
    unittest.main()
