const API_URL = 'http://localhost:5000/api/tasks';

let tasks = [];
let editTaskId = null;

// DOM Elements
const taskGrid = document.getElementById('taskGrid');
const taskForm = document.getElementById('taskForm');
const modal = document.getElementById('taskModal');
const addTaskBtn = document.getElementById('addTaskBtn');
const closeModalBtn = document.getElementById('closeModal');
const filterBtns = document.querySelectorAll('.filter-btn');

// Fetch Tasks
async function fetchTasks() {
    try {
        const res = await fetch(API_URL);
        tasks = await res.json();
        renderTasks('All');
    } catch (err) {
        console.error('Error fetching tasks:', err);
    }
}

// Render Tasks
function renderTasks(filter) {
    taskGrid.innerHTML = '';
    const filteredTasks = filter === 'All' ? tasks : tasks.filter(t => t.status === filter.replace(' ', ''));

    filteredTasks.forEach(task => {
        const card = document.createElement('div');
        const statusClass = task.status.replace(' ', '');
        card.className = `task-card ${statusClass}`;

        card.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description || 'No description'}</p>
            <div class="status-badge badge-${statusClass}">${task.status}</div>
            <div class="actions">
                <button class="btn btn-small btn-primary" onclick="openEditModal('${task._id}')">Edit</button>
                <button class="btn btn-small btn-delete" onclick="deleteTask('${task._id}')">Delete</button>
            </div>
        `;
        taskGrid.appendChild(card);
    });
}

// Open Modal
addTaskBtn.onclick = () => {
    editTaskId = null;
    taskForm.reset();
    document.getElementById('modalTitle').innerText = 'Add New Task';
    modal.classList.add('active');
};

closeModalBtn.onclick = () => modal.classList.remove('active');

// Save Task
taskForm.onsubmit = async (e) => {
    e.preventDefault();
    const taskData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        status: document.getElementById('status').value
    };

    try {
        if (editTaskId) {
            await fetch(`${API_URL}/${editTaskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        } else {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        }
        modal.classList.remove('active');
        fetchTasks();
    } catch (err) {
        console.error('Error saving task:', err);
    }
};

// Edit Task
async function openEditModal(id) {
    const task = tasks.find(t => t._id === id);
    if (!task) return;

    editTaskId = id;
    document.getElementById('title').value = task.title;
    document.getElementById('description').value = task.description;
    document.getElementById('status').value = task.status;
    document.getElementById('modalTitle').innerText = 'Edit Task';
    modal.classList.add('active');
}

// Delete Task
async function deleteTask(id) {
    if (!confirm('Are you sure?')) return;
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        fetchTasks();
    } catch (err) {
        console.error('Error deleting task:', err);
    }
}

// Filter Logic
filterBtns.forEach(btn => {
    btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTasks(btn.innerText);
    };
});

// Initial Load
fetchTasks();
