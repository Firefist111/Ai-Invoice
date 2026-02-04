import express from "express";
import { clerkMiddleware } from "@clerk/express";
import cors from 'cors'
import { config } from "dotenv";
import { connectDb } from "./config/db.js";
import invoiceRouter from "./routes/InvoiceRouter.js";
import path from 'path'
import businessProfileRouter from "./routes/BusinessProfileRouter.js";
import aiInvoiceRouter from "./routes/AiInvoiceRouter.js";
config()
const app = express();
const port = 3000;

//middleware
app.use(express.json({limit : "20mb"}))
app.use(express.urlencoded({limit : "20mb" , extended : true}))
app.use(cors({
  origin : '*',
  methods : ['GET','POST','PUT','DELETE'],
  credentials : true
}))
app.use(clerkMiddleware());

//Db
connectDb()


// Route middlewares
app.use('/uploads',express.static(path.join(process.cwd(),"uploads")))
app.use('/api/invoice',invoiceRouter)
app.use('/api/businessProfile',businessProfileRouter)
app.use('/api/ai',aiInvoiceRouter)

//routes
app.get("/", (req, res) => res.send("Hello World!"));

app.listen(port, () => console.log(` app listening on port ${port}!`));
