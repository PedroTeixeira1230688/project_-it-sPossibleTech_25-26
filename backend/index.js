import express from 'express';
import mongoose from 'mongoose';
import Task from './module/Task.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

//configuração swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Todo List API',
            version: '1.0.0',
            description: 'API gerida via objeto JavaScript'
        },
        servers: [{ url: 'http://localhost:5000' }],
        paths: {
            '/tasks/get': {
                get: {
                    summary: 'Lista todas as tarefas',
                    responses: { 200: { description: 'Sucesso' } }
                }
            },
            '/tasks/post': {
                post: {
                    summary: 'Cria uma tarefa',
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' } } } } }
                    },
                    responses: { 201: { description: 'Criada' } }
                }
            },
            '/tasks/{id}/complete': {
                post: {
                    summary: 'Alternar estado de conclusão',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Atualizada' } }
                }
            },
            '/tasks/{id}/delete': {
                delete: {
                    summary: 'Apagar tarefa',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Apagada' } }
                }
            }
        }
    },
    apis: [],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


//lista todas as tarefas
app.get('/tasks/get', async (req, res) => {
    const tasks = await Task.find();
    res.json(tasks);
});

//cria uma nova tarefa
app.post('/tasks/post', async (req, res) => {
    try {
        const newTask = await Task.create(req.body);
        res.status(201).send(newTask);
    } catch (error) {
        res.status(400).send({ message: "Erro ao criar tarefa" });
    }
});

//altera o estado de conclusão de uma tarefa
app.post('/tasks/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        task.completed = !task.completed;
        await task.save();
        res.json(task);
    } catch (error) {
        res.status(400).json({ message: "Invalid ID" });
    }
});

// apaga uma tarefa
app.delete('/tasks/:id/delete', async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        await task.deleteOne();
        res.json({ message: "Task deleted" });
    } catch (error) {
        res.status(400).json({ message: "Error deleting task" });
    }
});

mongoose.connect('mongodb+srv://pedroteixeira03062005_db_user:xvcMFZY3zvkI5Rig@cluster0.qtuiqtv.mongodb.net/todo_app')
    .then(() => {
        console.log('MongoDB Connected');
        app.listen(5000, () => {
            console.log('Server running on http://localhost:5000');
            console.log('Swagger UI em http://localhost:5000/api-docs');
        });
    })
    .catch(err => console.log('MongoDB Connection Error:', err));