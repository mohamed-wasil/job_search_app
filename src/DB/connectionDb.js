import mongoose from "mongoose";

const databaseConnection = async()=>{
    try {
        await mongoose.connect(process.env.DB_URI)
        console.log("database connected");
    } catch (error) {
        console.log("connection error ", error);
    }
}
export default databaseConnection