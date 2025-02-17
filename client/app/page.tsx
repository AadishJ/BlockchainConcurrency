"use client"
import { useState, useEffect } from "react";
import { ethers, JsonRpcProvider } from "ethers";
import ToDoListArtifact from "../public/TodoList.json";


interface Task {
  id: number;
  content: string;
  completed: boolean;
}

const TodoList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>("");
  const [contract, setContract] = useState<any>(null);   // eslint-disable-line
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [userAddress, setUserAddress] = useState<string>("");
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  const contractAddress = "0xda4Ad5F952A0657380951F880e8C9a4CdF4AEc18";
  const contractABI = ToDoListArtifact.abi;

  useEffect(() => {
    const loadBlockchainData = async () => {
      try {
        const provider = new JsonRpcProvider("http://127.0.0.1:7545");
        const signer = await provider.getSigner(0);
        const address = await signer.getAddress();
        setUserAddress(address);
        setIsConnected(true);

        const todoListContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        setContract(todoListContract);
        await refreshTasks(todoListContract);
      } catch (error) {
        console.error("Error connecting to Ganache:", error);
      }
    };

    loadBlockchainData();
  }, []);  // eslint-disable-line

  const refreshTasks = async (contractInstance: any) => {   // eslint-disable-line
    const taskCount = await contractInstance.taskCount();
    const taskList: Task[] = [];
    for(let i = 1; i <= Number(taskCount); i++) {
      try {
        const task = await contractInstance.tasks(i);
        taskList.push({
          id: Number(task.id),
          content: task.content,
          completed: task.completed
        });
      } catch (error) {
        console.error(`Error fetching task ${i}:`, error);
      }
    }
    setTasks(taskList);
  };

  const addTask = async () => {
    if (contract && newTask) {
      try {
        const tx = await contract.createTask(newTask);
        await tx.wait();
        setNewTask("");
        await refreshTasks(contract);
      } catch (error) {
        console.error("Error adding task:", error);
      }
    }
  };

  const addBatchTasks = async () => {
    if (contract) {
      try {
        setIsBatchProcessing(true);
        const provider = contract.runner.provider;

        await provider.send("miner_stop", []);

        // Sequential Execution
        console.log("\nStarting Sequential Operations...");
        console.log("----------------------------------------");
        const startTimeSeq = performance.now();

        // Create 20 tasks sequentially
        const createTransactions = [];
        for (let i = 0; i < 20; i++) {
          const tx = await contract.createTask(`Created Task ${i + 1}`);
          createTransactions.push(tx);
          console.log(`Created Task ${i + 1}`);
        }

        // Mine tasks
        await provider.send("evm_mine", []);
        await Promise.all(createTransactions.map(tx => tx.wait()));
        console.log("All create transactions mined");

        // Read 180 tasks sequentially
        for (let i = 1; i <= 180; i++) {
          const task = await contract.readTask(i % 20 + 1); // Read in circular manner
          console.log(`Read Task ${i}: ${task.content}`);
        }

        const endTimeSeq = performance.now();
        const totalSecondsSeq = (endTimeSeq - startTimeSeq) / 1000;
        console.log("\nSequential Statistics:");
        console.log(`Total time: ${totalSecondsSeq.toFixed(3)} seconds`);
        console.log(`Average time per operation: ${(totalSecondsSeq / 200).toFixed(3)} seconds`);

        // Concurrent Execution
        console.log("\nStarting Concurrent Operations...");
        console.log("----------------------------------------");
        const startTimeCon = performance.now();

        // Create 20 tasks concurrently
        const createPromises = Array.from({ length: 20 }, (_, i) =>
          contract.createTask(`Concurrent Task ${i + 1}`)
        );
        const createdTasks = await Promise.all(createPromises);
        console.log("All create transactions submitted");

        // Mine create transactions
        await provider.send("evm_mine", []);
        await Promise.all(createdTasks.map(tx => tx.wait()));
        console.log("All create transactions mined");

        // Read 180 tasks concurrently
        const readPromises = Array.from({ length: 180 }, (_, i) =>
          contract.readTask(i % 20 + 1)
        );
        await Promise.all(readPromises);
        console.log("All read operations completed");

        const endTimeCon = performance.now();
        const totalSecondsCon = (endTimeCon - startTimeCon) / 1000;

        console.log("\nConcurrent Statistics:");
        console.log(`Total time: ${totalSecondsCon.toFixed(3)} seconds`);
        console.log(`Average time per operation: ${(totalSecondsCon / 200).toFixed(3)} seconds`);

        console.log("\nComparison:");
        console.log(`Sequential vs Concurrent: ${totalSecondsSeq.toFixed(3)}s vs ${totalSecondsCon.toFixed(3)}s`);
        console.log(`Performance improvement: ${((totalSecondsSeq - totalSecondsCon) / totalSecondsSeq * 100).toFixed(2)}%`);

        // Restart auto-mining
        await provider.send("miner_start", []);

        // Refresh task list
        await refreshTasks(contract);
        setIsBatchProcessing(false);
      } catch (error) {
        console.error("Error in batch operations:", error);
        setIsBatchProcessing(false);
        try {
          await contract.runner.provider.send("miner_start", []);
        } catch (e) {
          console.error("Error restarting mining:", e);
        }
      }
    }
  };
  const toggleTaskCompletion = async (taskId: number) => {
    if (contract) {
      try {
        const tx = await contract.toggleTask(taskId);
        await tx.wait();
        await refreshTasks(contract);
      } catch (error) {
        console.error("Error toggling task completion:", error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Todo List</h1>

      <div className="mb-6">
        {isConnected ? (
          <p className="text-gray-700">Connected as: {userAddress}</p>
        ) : (
          <p className="text-red-500">Connecting to Ganache...</p>
        )}
      </div>

      <div className="mt-6 mb-8 flex gap-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Enter new task"
          className="p-2 w-64 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addTask}
          disabled={isBatchProcessing}
          className="bg-green-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-600 transition-all disabled:opacity-50"
        >
          Add Task
        </button>
        <button
          onClick={addBatchTasks}
          disabled={isBatchProcessing}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-600 transition-all disabled:opacity-50"
        >
          {isBatchProcessing ? 'Processing...' : 'Create 20 & Read 180'}
        </button>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Tasks ({tasks.length})</h2>
      {tasks.length === 0 ? (
        <p className="text-gray-500">No tasks yet!</p>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md hover:shadow-lg"
            >
              <span
                className={`text-lg ${task.completed ? "line-through text-gray-400" : ""}`}
              >
                {task.content}
              </span>
              <button
                onClick={() => toggleTaskCompletion(task.id)}
                disabled={isBatchProcessing}
                className="ml-4 text-sm text-blue-500 hover:text-blue-700 disabled:opacity-50"
              >
                {task.completed ? "Undo" : "Complete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TodoList;