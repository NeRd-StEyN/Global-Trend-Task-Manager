const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Get all tasks
router.get('/', (req, res) => {
    try {
        const tasks = db.get('tasks').orderBy('createdAt', 'desc').value();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a task
router.post('/', (req, res) => {
    try {
        const newTask = {
            _id: uuidv4(),
            title: req.body.title,
            description: req.body.description,
            status: req.body.status || 'Pending',
            createdAt: new Date().toISOString()
        };

        db.get('tasks').push(newTask).write();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a task
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const task = db.get('tasks').find({ _id: id }).value();

        if (!task) return res.status(404).json({ message: 'Task not found' });

        db.get('tasks')
            .find({ _id: id })
            .assign(req.body)
            .write();

        const updatedTask = db.get('tasks').find({ _id: id }).value();
        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a task
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const task = db.get('tasks').find({ _id: id }).value();

        if (!task) return res.status(404).json({ message: 'Task not found' });

        db.get('tasks').remove({ _id: id }).write();
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
