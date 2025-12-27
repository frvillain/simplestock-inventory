import "./style.css";

const pName = document.getElementById("product-name");
const pCategory = document.getElementById("product-category");
const pPrice = document.getElementById("product-price");
const pQty = document.getElementById("product-qty");
const addBtn = document.getElementById("add-btn");
const tBody = document.getElementById("inventory-list");

const API_URL = "http://localhost:3000/items";

async function fetchInventory() {
  tBody.innerHTML = `
    <tr>
        <td colspan="5" style="text-align: center; padding: 20px;">
            Loading inventory...
        </td>
    </tr>
  `;
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Server Error");
    }
    const data = await response.json();

    renderInventory(data);
  } catch (error) {
    tBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error loading data</td></tr>`;
  }
}

async function renderInventory(data) {
  tBody.innerHTML = data
    .map(
      (item) => `
  <tr>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>₱${item.price}</td>
      <td>
        <button class="btn-qty" data-id="${item.id}" data-action="decrease">-</button>
        <span>${item.quantity}</span>
        <button class="btn-qty" data-id="${item.id}" data-action="increase">+</button>
      </td>
      <td>
        <button class="btn-delete" data-id="${item.id}">Delete</button>
      </td>

  </tr>
  `
    )
    .join("");
}

async function addProduct() {
  const productName = pName.value;
  const productCategory = pCategory.value;
  const productPrice = Number(pPrice.value);
  const productQty = Number(pQty.value);

  if (productName.trim() === "") {
    alert("Please enter a valid product name.");
    return;
  }

  await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: productName,
      category: productCategory,
      price: productPrice,
      quantity: productQty,
    }),
  });

  pName.value = "";
  pPrice.value = "";
  pQty.value = "";
  fetchInventory();
}

async function updateQuantity(id, action) {
  await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: action }),
  });
  fetchInventory();
}

async function deleteProduct(id) {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  fetchInventory();
}

fetchInventory();

addBtn.addEventListener("click", addProduct);

tBody.addEventListener("click", (e) => {
  const id = e.target.getAttribute("data-id");

  if (e.target.classList.contains("btn-qty")) {
    const action = e.target.getAttribute("data-action");
    updateQuantity(id, action);
  }
  if (e.target.classList.contains("btn-delete")) {
    deleteProduct(id);
  }
});
