import "./style.css";

const pName = document.getElementById("product-name");
const pCategory = document.getElementById("product-category");
const pPrice = document.getElementById("product-price");
const pQty = document.getElementById("product-qty");
const addBtn = document.getElementById("add-btn");
const tBody = document.getElementById("inventory-list");
const searchInput = document.getElementById("search-box");
const pFilter = document.getElementById("filter-category");
const filterBtn = document.getElementById("btn-filter");

const isLocal = window.location.hostname === "localhost";
const API_URL = isLocal
  ? "http://localhost:3000/items"
  : "https://simplestock-inventory-production.up.railway.app/items";

let allProducts = [];
let currentFilter = "All";

async function fetchInventory(searchQuery = ``) {
  tBody.innerHTML = `
    <tr>
        <td colspan="5" style="text-align: center; padding: 20px;">
            Loading inventory...
        </td>
    </tr>
  `;
  try {
    let url = API_URL;
    if (searchQuery) {
      url = `${API_URL}?search=${searchQuery}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Server Error");
    }

    const data = await response.json();
    allProducts = data;
    // renderInventory(allProducts);
    applyFilter();
  } catch (error) {
    tBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error loading data</td></tr>`;
  }
}

function applyFilter() {
  let result = allProducts;
  if (currentFilter !== "All") {
    result = result.filter((product) => product.category === currentFilter);
  }

  renderInventory(result);
}

async function renderInventory(data) {
  tBody.innerHTML = data
    .map((item) => {
      const lowStockClass = item.quantity < 5 ? `low-stock` : ``;
      return `<tr class="${lowStockClass}">
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>₱${item.price}</td>
      <td>
        <button class="btn-qty" data-id="${item._id}" data-action="decrease">-</button>
        <span>${item.quantity}</span>
        <button class="btn-qty" data-id="${item._id}" data-action="increase">+</button>
      </td>
      <td id="action-buttons">
        <button class="btn-delete" data-id="${item._id}">Delete</button>
        <button class="btn-edit" data-id="${item._id}">Edit</button>
      </td>

  </tr>
  `;
    })
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

  const originalText = addBtn.innerText;
  addBtn.innerText = "Adding...";
  addBtn.disabled = true;

  try {
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
    pCategory.value = "";
    fetchInventory();
    showToast("Product added succesfully", "success");
  } catch (error) {
    alert("Failed to add product");
  } finally {
    addBtn.innerText = originalText;
    addBtn.disabled = false;
  }
}

async function updateQuantity(id, action) {
  await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: action }),
  });
  fetchInventory();
}

async function updateItem(id, newName, newPrice) {
  try {
    await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, price: newPrice }),
    });
    fetchInventory();
    showToast("Product updated!", "success");
  } catch (error) {
    alert("Error updating product");
  }
}

async function deleteProduct(id) {
  const isConfirmed = confirm("Are you sure you want to delete this item?");

  if (!isConfirmed) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete.");

    fetchInventory();

    showToast("Product deleted successfully!", "danger");
  } catch (error) {
    alert(`Error deleting product.`);
  }
}

// function filterByCategory(category) {
//   if (category === "All") {
//     renderInventory(allProducts);
//   } else {
//     const filtered = allProducts.filter(
//       (product) => product.category === category
//     );
//     renderInventory(filtered);
//   }
// }

// A utility function to delay execution
function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");

  // Create the element
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  // Add to screen
  container.appendChild(toast);

  // Trigger animation (small delay ensures CSS transition catches it)
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    // Wait for fade out animation to finish before removing from DOM
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
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
  if (e.target.classList.contains("btn-edit")) {
    const editItem = allProducts.find((item) => item._id === id);

    const newName = prompt("Enter new name:", editItem.name);
    const newPrice = Number(prompt("Enter new price:", editItem.price));

    if (!newName || !newPrice) {
      alert("No changes made.");
      return;
    }

    updateItem(id, newName, newPrice);
  }
});

const handleSearch = debounce((e) => {
  const text = e.target.value;
  fetchInventory(text);
}, 500);

searchInput.addEventListener("input", handleSearch);

filterBtn.addEventListener("click", () => {
  currentFilter = pFilter.value;
  applyFilter();
});
