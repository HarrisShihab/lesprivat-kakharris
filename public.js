function togglePublicNav() {
  const nav = document.getElementById("public-nav");
  const button = document.getElementById("nav-toggle");
  if (!nav || !button) return;

  const isOpen = nav.classList.toggle("is-open");
  button.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("nav-open", isOpen);
}

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("public-nav");
  const button = document.getElementById("nav-toggle");

  if (nav && button) {
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
      });
    });
  }
});
