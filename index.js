import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Database Connection
(async () => {
    try {
        const URL = process.env.MONGODB_URL;
        console.log("URL :", URL);
        await mongoose.connect(URL, {                   
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`DB connected.`);
    } catch (error) {
        console.error("Error connecting to the database:", error);
    }
})();

const userSchema = new mongoose.Schema({
    Phone : String,
    name : String, 
    email : String,
    password : String
});
const User = new mongoose.model("User", userSchema);

const budgetSchema = new mongoose.Schema({
    amount : Number,
    description : String,
});
const Budget = new mongoose.model("Budget", budgetSchema);

const expenseSchema = new mongoose.Schema({
    date :{type : Date, required: true}, 
    description:{type : String, required:true} ,
    amount:{type : Number, required:true}, 
    isReset : {type : Boolean, required: true}
})
const Expense = mongoose.model("Expense", expenseSchema);



// Routes
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email });

        if (user) {
            if (password === user.password) {
                res.send({ message: "Login Successful", user: user });
            } else {
                res.send({message : "Password didn't match"});
            }
        } else {
            res.send({ message: "User not registered" });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});


app.post("/register", async (req, res) => {
    const {Phone, name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            res.status(409).json({ message: "User already registered." });
        } else {
            const newUser = new User({
                Phone,
                name,
                email,
                password
            });

            await newUser.save();

            res.status(201).json({ message: "Successfully registered, Please Login now." });
        }
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post("/budget", async(req, res) =>{
    try{
        const newBudget = new Budget(req.body);
        await newBudget.save();
        res.json({message: "Budget Added Successfully"});
    }catch(error){
        console.log(error);
        res.status(500).json({error:"Internal Server error"});
    }
});

app.get('/total-amount', async (req, res) => {
    try{
        const allBudgets = await Budget.find();
        let totalAmount = 0;
        allBudgets.forEach(element => {
            totalAmount += element.amount; 
        });
        res.json({amount : totalAmount});
    }catch(error){
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

app.post('/expenses', async (req, res) => {
    try {
      const { date, description, amount } = req.body;
      console.log("Received request with data:", { date, description, amount });
  
      const newExpense = new Expense({ date, description, amount, isReset: false });
      await newExpense.save();
  
      console.log("Expense added successfully.");
      res.json({ message: "Expense added successfully." });
    } catch (error) {
      console.error("Error adding expense:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/getexpenses', async (req, res) => {
    try {
        const expenses = await Expense.find({isReset:'false'});
        res.json(expenses);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/getresetexpenses', async (req, res) => {
    try{
        const resetExpenses = await Expense.find({isReset:'false'});
        console.log(resetExpenses);
        res.json(resetExpenses);
    }catch(error){
        console.log(error);
        res.status(500).json({message : 'Internal server error'});
    }
});

app.put('/expenses/:id', async (req, res) => {
    try {
      const expenseId = req.params.id; 
      console.log("expense ID:"+expenseId);
      const { description, amount } = req.body;
  
      console.log("Received request to update expense with ID:", expenseId);
  
      const updatedExpense = await Expense.findByIdAndUpdate(
        expenseId,
        { description, amount },
        { new: true }
      );
  
      console.log("Updated Expense:", updatedExpense);
  
      if (updatedExpense) {
        console.log("Expense updated successfully.");
        res.json({ message: "Expense updated successfully." });
      } else {
        console.error("Expense not found for ID:", expenseId);
        res.status(404).json({ error: 'Expense not found' });
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  

app.get('/expenseamount', async (req, res) => {
    try{
        const allExpense = await Expense.find({isReset: false});
        console.log("allExpense:",allExpense);
        let totalAmount = 0;
        allExpense.forEach(element => {
            totalAmount += element.amount; 
        });
        res.json({amount : totalAmount});
    }catch(error){
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

app.get('/amount-left', async (req, res) =>{
    try{
        const allBudgets = await Budget.find();
        let totalBudget = 0;
        allBudgets.forEach(element =>{
            totalBudget += element.amount;
        });
        console.log("totalBudget:"+totalBudget);
        const allExpenses = await Expense.find();
        let totalExpense = 0;
        allExpenses.forEach(element =>{
            totalExpense += element.amount;
        });
        console.log("totalExpense:"+totalExpense);
        const amountLeft = totalBudget - totalExpense;
        console.log("amountLeft:"+amountLeft);
        res.json({amountLeft});

    }catch(error){
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

app.post('/refresh', async(req, res) => {
    try{
        await Expense.updateMany({}, {$set:{isReset : 'true'}});
        res.status(200).json({message: 'Database updated successfully.'});
    }catch(error){
        console.log('Error updating database:', error);
        res.status(500).json({message : 'Internal server error'});
    }
});

app.delete('/expenses/:id', async(req, res) =>{
    try{
        const expenseId = req.params.id;
        console.log("Id to be deleted:", expenseId);
        const deleteExpense = await Expense.findByIdAndDelete(expenseId);
        if(deleteExpense){
            console.log("Expense deleted successfully.")
            res.json({message: "Expense deleted successfully"});
        }else{
            console.error("Expense not found for ID:", expenseId);
            res.status(400).json({message: 'Expense not found'});
        }
    }catch(error){
        console.log('Error deleting in database:', error);
        res.status(500).json({message : 'Internal server error'});
    }
})


 
// Start the server
console.log("PORT Number:"+PORT);
app.listen(PORT, () => {
    console.log(`App started on port ${PORT}`);
});
