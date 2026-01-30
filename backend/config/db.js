
import mongoose, { mongo } from "mongoose";

export const connectDb = ()=>{
   mongoose.connect(
    "mongodb+srv://aniketnaik2004_db_user:67u45LHNfOGksvfw@cluster0.hr4uwly.mongodb.net/"
  )
  .then(()=>{
    console.log('Mongodb connected')
  })
  ;
}