const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

const DB_FILE = path.join(__dirname, "inventory.json");

app.use(cors());
app.use(express.json());

function getInventory() {
  if (!fs.existsSync(DB_FILE)) return [];
  const data = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(data);
}

function saveInventory(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.get("/items", (req, res) => {
  const items = getInventory();
  res.json(items);
});

app.post("/items", (req, res) => {
  const items = getInventory();
  const newItem = req.body;

  newItem.id = Date.now();
  items.push(newItem);
  saveInventory(items);

  res.json(newItem);
});

app.patch("/items/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const action = req.body.action;

  const items = getInventory();
  const itemToUpdate = items.find((item) => item.id === id);

  if (itemToUpdate) {
    if (action === "increase") {
      itemToUpdate.quantity += 1;
    }
    if (action === "decrease") {
      if (itemToUpdate.quantity > 0) {
        itemToUpdate.quantity -= 1;
      }
    }
  }

  saveInventory(items);
  res.json(itemToUpdate);
});

app.delete("/items/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const items = getInventory();

  const newInventory = items.filter((item) => item.id !== id);
  saveInventory(newInventory);

  res.json(newInventory);
});

app.listen(PORT, (req, res) => {
  console.log(`SimpleStock server running at PORT:${PORT}`);
});
