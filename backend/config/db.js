const mongoose=require("mongoose")
const connectDB=async()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Databse connected")
        return true
    } catch (error) {
        console.log("Failed to connect Database")
        console.log(error)
        return false
    }
}
module.exports=connectDB