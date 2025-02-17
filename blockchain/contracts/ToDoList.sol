// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TodoList {
    struct Task {
        uint id;
        string content;
        bool completed;
    }

    mapping(uint => Task) public tasks;
    uint public taskCount;

    function createTask(string memory _content) public {
        taskCount++;
        tasks[taskCount] = Task(taskCount, _content, false);
    }

    function toggleTask(uint _id) public {
        tasks[_id].completed = !tasks[_id].completed;
    }

    function readTask(uint _id) public view returns (uint id, string memory content, bool completed) {
        require(_id > 0 && _id <= taskCount, "Task ID out of range");
        Task memory task = tasks[_id];
        return (task.id, task.content, task.completed);
    }
}