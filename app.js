console.log("app.js loaded ✅");

const show = (id) => {
  document.getElementById("screenLoading")?.classList.add("hidden");
  document.getElementById("screenAuth")?.classList.add("hidden");
  document.getElementById("screenApp")?.classList.add("hidden");
  document.getElementById(id)?.classList.remove("hidden");
};

document.addEventListener("DOMContentLoaded", () => {
  show("screenAuth"); // כרגע: תמיד מציגים מסך התחברות
});
