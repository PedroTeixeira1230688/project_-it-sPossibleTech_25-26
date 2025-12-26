import express from 'express';
import mongoose from 'mongoose';
import Task from './module/Task.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const auth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ message: "Acesso negado. Token não fornecido." });

    try {
        const decoded = jwt.verify(token, process.env.CHAVE_SECRETA);
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token inválido ou expirado." });
    }
};

app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (username === process.env.USER && password === process.env.PASSWORD) {
        const token = jwt.sign({ id: "user_123" }, process.env.CHAVE_SECRETA, { expiresIn: '1h' });
        return res.json({ token });
    }
    res.status(401).json({ message: "Credenciais erradas" });
});

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
app.get('/tasks/get', auth, async (req, res) => {
    const tasks = await Task.find();
    res.json(tasks);
});

//cria uma nova tarefa
app.post('/tasks/post', auth, async (req, res) => {
    try {
        const newTask = await Task.create(req.body);
        res.status(201).send(newTask);
    } catch (error) {
        res.status(400).send({ message: "Erro ao criar a tarefa" });
    }
});

//altera o estado de conclusão de uma tarefa
app.post('/tasks/:id/complete', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: "Tarefa não encontrada" });

        task.completed = !task.completed;
        await task.save();
        res.json(task);
    } catch (error) {
        res.status(400).json({ message: "ID inválido" });
    }
});

// apaga uma tarefa
app.delete('/tasks/:id/delete', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: "Tarefa não encontrada" });

        await task.deleteOne();
        res.json({ message: "Tarefa apagada com sucesso" });
    } catch (error) {
        res.status(400).json({ message: "Erro ao apagar a tarefa" });
    }
});

// conecta ao MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log('Server running on http://localhost:5000');
            console.log('Swagger UI em http://localhost:5000/api-docs');
        });
    })
    .catch(err => console.log('MongoDB Connection Error:', err));