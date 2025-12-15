// js/ui.js
window.el = (id) => document.getElementById(id);

window.showMsg = (text, type = "ok") => {
  const box = window.el("msg");
  if (!box) return alert(text);
  box.className = `msg ${type}`;
  box.textContent = text;
};

window.clearMsg = () => {
  const box = window.el("msg");
  if (!box) return;
  box.className = "msg";
  box.textContent = "";
};

window.setLoggedInUI = (isLoggedIn) => {
  const a = window.el("authCard");
  const b = window.el("appCard");
  if (a) a.classList.toggle("hidden", isLoggedIn);
  if (b) b.classList.toggle("hidden", !isLoggedIn);
};
