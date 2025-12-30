require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

const DB_FILE = path.join(__dirname, "inventory.json");

app.use(
  cors({
    origin: [
      "https://simplestock-inventory.netlify.app",
      "http://localhost:5173",
    ],
  })
);
app.use(express.json());

function getInventory() {
  if (!fs.existsSync(DB_FILE)) return [];
  const data = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(data);
}

function saveInventory(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB (The Freezer is Open!)"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const itemSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  quantity: Number,
});

const Item = mongoose.model(`Item`, itemSchema);

app.get("/items", async (req, res) => {
  try {
    const search = req.query.search;
    let query = {};

    if (search) {
      query = {
        name: {
          $regex: search,
          $options: `i`,
        },
      };
    }

    const items = await Item.find(query);

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching items" });
  }
});

app.post("/items", async (req, res) => {
  try {
    const newItem = new Item({
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      quantity: req.body.quantity,
    });

    const savedItem = await newItem.save();
    res.json(savedItem);
  } catch (error) {
    res.status(500).json({ message: "Error saving item" });
  }
});

app.patch("/items/:id", async (req, res) => {
  // const id = parseInt(req.params.id);
  // const action = req.body.action;

  // const items = getInventory();
  // const itemToUpdate = items.find((item) => item.id === id);

  // if (itemToUpdate) {
  //   if (action === "increase") {
  //     itemToUpdate.quantity += 1;
  //   }
  //   if (action === "decrease") {
  //     if (itemToUpdate.quantity > 0) {
  //       itemToUpdate.quantity -= 1;
  //     }
  //   }
  // }

  // saveInventory(items);
  // res.json(itemToUpdate);

  try {
    const id = req.params.id;
    const action = req.body.action;

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (action === `increase`) {
      item.quantity += 1;
    } else if (action === `decrease`) {
      if (item.quantity > 0) {
        item.quantity -= 1;
      }
    }

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: "Error updating quantity" });
  }
});

app.delete("/items/:id", async (req, res) => {
  // const id = parseInt(req.params.id);
  // const items = getInventory();
  // const newInventory = items.filter((item) => item.id !== id);
  // saveInventory(newInventory);
  // res.json(newInventory);

  try {
    const id = req.params.id;

    await Item.findByIdAndDelete(id);
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item" });
  }
});

app.listen(PORT, (req, res) => {
  console.log(`SimpleStock server running at PORT:${PORT}`);
});
