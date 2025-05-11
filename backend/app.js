import morgan from 'morgan'
import express from 'express'
import connect from './db/db.js'
import userRoutes from './routes/user.routes.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import projectRoutes from './routes/project.routes.js'
import Project from "./models/project.model.js";
import aiRoutes from './routes/ai.routes.js'
connect()

const app = express()

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended:true})) 
app.use(cookieParser())

app.use('/users',userRoutes)

app.use('/projects',projectRoutes)

app.use('/ai',aiRoutes)

app.get('/',(req,res) => { 
    res.send("Hello World")
 })
 app.get("/projects/:id/users", async (req, res) => {
    const project = await Project.findById(req.params.id).populate("users");
    res.json({ users: project.users.map((u) => u.email) });
  });

  


 export default app;