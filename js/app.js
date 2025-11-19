let productos = [];
let productosChart = null;

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const userInfoSpan = document.getElementById("userInfo");
  const userStr = localStorage.getItem("user");
  if (userStr) {
    const user = JSON.parse(userStr);
    userInfoSpan.textContent = `Conectado como: ${user.email}`;
  } else {
    userInfoSpan.textContent = "Conectado";
  }

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  });

  const tabButtons = document.querySelectorAll(".tab-button");
  const panels = document.querySelectorAll(".panel");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;

      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      panels.forEach((panel) => {
        if (panel.id === target) {
          panel.classList.add("panel-active");
        } else {
          panel.classList.remove("panel-active");
        }
      });
    });
  });

  const productoForm = document.getElementById("productoForm");
  const formTitle = document.getElementById("formTitle");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const formMessage = document.getElementById("formMessage");
  const listMessage = document.getElementById("listMessage");
  const filterCategoria = document.getElementById("filterCategoria");
  const filterMinPrice = document.getElementById("filterMinPrice");
  const filterMaxPrice = document.getElementById("filterMaxPrice");
  const searchBtn = document.getElementById("searchBtn");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const productosTableBody = document.getElementById("productosTableBody");

  loadProductos();

  // Filtros
  searchBtn.addEventListener("click", () => {
    const filters = {
      categoria: filterCategoria.value.trim() || undefined,
      min_price: filterMinPrice.value.trim() || undefined,
      max_price: filterMaxPrice.value.trim() || undefined,
    };
    loadProductos(filters);
  });

  clearSearchBtn.addEventListener("click", () => {
    filterCategoria.value = "";
    filterMinPrice.value = "";
    filterMaxPrice.value = "";
    loadProductos();
  });

  productoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formMessage.textContent = "";
    formMessage.className = "message";

    const formData = new FormData(productoForm);
    const obj = Object.fromEntries(formData.entries());
    const id = obj.id;
    delete obj.id;

    if (obj.precio !== undefined && obj.precio !== "") {
      obj.precio = parseFloat(obj.precio);
    }
    if (obj.stock !== undefined && obj.stock !== "") {
      obj.stock = parseInt(obj.stock, 10);
    } else {
      obj.stock = null;
    }
    if (obj.categoria === "") {
      obj.categoria = null;
    }

    try {
      if (id) {
        await apiUpdateProducto(id, obj);
        formMessage.textContent = "Producto actualizado correctamente.";
      } else {
        await apiCreateProducto(obj);
        formMessage.textContent = "Producto creado correctamente.";
      }

      formMessage.classList.add("success");
      productoForm.reset();
      document.getElementById("productoId").value = "";
      formTitle.textContent = "Crear producto";
      cancelEditBtn.classList.add("hidden");

      await loadProductos();
    } catch (err) {
      console.error(err);
      formMessage.textContent = err.message || "Error al guardar el producto";
      formMessage.classList.add("error");
    }
  });

  cancelEditBtn.addEventListener("click", () => {
    productoForm.reset();
    document.getElementById("productoId").value = "";
    formTitle.textContent = "Crear producto";
    cancelEditBtn.classList.add("hidden");
    formMessage.textContent = "";
    formMessage.className = "message";
  });

  productosTableBody.addEventListener("click", async (e) => {
    const btn = e.target;

    if (btn.matches(".btn-edit")) {
      const id = btn.dataset.id;
      const prod = productos.find((p) => String(p.id) === String(id));
      if (!prod) return;

      document.getElementById("productoId").value = prod.id;
      document.getElementById("nombre").value = prod.nombre || "";
      document.getElementById("categoria").value = prod.categoria || "";
      document.getElementById("precio").value = prod.precio ?? "";
      document.getElementById("stock").value = prod.stock ?? "";

      formTitle.textContent = `Editar producto #${prod.id}`;
      cancelEditBtn.classList.remove("hidden");
      productoForm.scrollIntoView({ behavior: "smooth" });
    }

    if (btn.matches(".btn-delete")) {
      const id = btn.dataset.id;
      const confirmar = confirm(`¿Seguro que quieres eliminar el producto #${id}?`);
      if (!confirmar) return;

      try {
        await apiDeleteProducto(id);
        await loadProductos();
      } catch (err) {
        console.error(err);
        listMessage.textContent = err.message || "Error al eliminar el producto";
        listMessage.classList.add("error");
      }
    }
  });


  async function loadProductos(filters = {}) {
    listMessage.textContent = "";
    listMessage.className = "message";
    productosTableBody.innerHTML = "<tr><td colspan='6'>Cargando...</td></tr>";

    try {
      productos = await apiGetProductos(filters);

      if (!Array.isArray(productos)) {
        productos = [];
      }

      if (productos.length === 0) {
        productosTableBody.innerHTML = "<tr><td colspan='6'>No hay productos.</td></tr>";
        updateChart([]);
        return;
      }

      productosTableBody.innerHTML = productos
        .map((p) => {
          const precio = formatCurrency(p.precio);
          const stock = p.stock ?? "";
          const categoria = p.categoria || "Sin categoría";

          return `
            <tr>
              <td>${p.id}</td>
              <td>${escapeHtml(p.nombre)}</td>
              <td>${escapeHtml(categoria)}</td>
              <td>${precio}</td>
              <td>${stock}</td>
              <td>
                <button class="btn btn-secondary btn-edit" data-id="${p.id}">Editar</button>
                <button class="btn btn-danger btn-delete" data-id="${p.id}">Eliminar</button>
              </td>
            </tr>
          `;
        })
        .join("");

      updateChart(productos);
    } catch (err) {
      console.error(err);
      productosTableBody.innerHTML = "";
      listMessage.textContent = err.message || "Error al cargar los productos";
      listMessage.classList.add("error");
    }
  }

  function updateChart(productos) {
    const ctx = document.getElementById("productosChart");
    if (!ctx) return;

    const counts = {};
    for (const p of productos) {
      const cat = (p.categoria || "Sin categoría").trim() || "Sin categoría";
      counts[cat] = (counts[cat] || 0) + 1;
    }

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    if (productosChart) {
      productosChart.data.labels = labels;
      productosChart.data.datasets[0].data = data;
      productosChart.update();
      return;
    }

    productosChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Cantidad de productos por categoría",
            data,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: "#e5e7eb",
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#e5e7eb",
            },
          },
          y: {
            ticks: {
              color: "#e5e7eb",
            },
          },
        },
      },
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function formatCurrency(value) {
    if (value === null || value === undefined) return "";
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
});
