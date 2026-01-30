import express from 'express';
import multer from 'multer';
import path from 'path';
import { clerkMiddleware } from '@clerk/express';
import { createBusinessProfie, getMyBusinessProfile, updateBusinessProfile } from '../controllers/BusinessProfileController.js';

const businessProfileRouter = express.Router();

businessProfileRouter.use(clerkMiddleware());

//multer setup for file uploads

const storage = multer.diskStorage({
  destination : (req,file,cb)=>{
    cb(null,path.join(process.cwd(), 'uploads'))
  },
  filename : (req,file,cb)=>{
    const unique = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null,`business-${unique}${ext}`);
  }
})

const upload = multer({storage});


businessProfileRouter.post('/',upload.fields([
  {name: 'logoName', maxCount:1},
  {name: 'stampName', maxCount:1},
  {name: 'signatureNameMeta', maxCount:1},
])
,createBusinessProfie
)

businessProfileRouter.put('/:id',upload.fields([
  {name: 'logoName', maxCount:1},
  {name: 'stampName', maxCount:1},
  {name: 'signatureNameMeta', maxCount:1},
]),
updateBusinessProfile
)


businessProfileRouter.get('/me',getMyBusinessProfile)

export default businessProfileRouter;