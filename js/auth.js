document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginMessage.textContent = "";
    loginMessage.className = "message";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const data = await apiLogin(email, password);

      const token = data.access_token || data.token;
      if (!token) throw new Error("El backend no devolvió un token");

      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          email,
        })
      );

      loginMessage.textContent = "Login exitoso, redirigiendo...";
      loginMessage.classList.add("success");

      setTimeout(() => {
        window.location.href = "app.html";
      }, 700);
    } catch (err) {
      console.error(err);
      loginMessage.textContent = err.message || "Error al intentar iniciar sesión";
      loginMessage.classList.add("error");
    }
  });
});
