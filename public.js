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
    if (!nav.querySelector('a[href="math-lab-public.html"]')) {
      const mathLabLink = document.createElement("a");
      mathLabLink.href = "math-lab-public.html";
      mathLabLink.textContent = "Free Math Lab";
      mathLabLink.className = "nav-math-lab";
      const loginLink = nav.querySelector(".nav-login");
      if (loginLink) nav.insertBefore(mathLabLink, loginLink);
      else nav.appendChild(mathLabLink);
    }

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
      });
    });
  }

  const heroActions = document.querySelector(".hero-actions");
  if (heroActions && !heroActions.querySelector('a[href="math-lab-public.html"]')) {
    const mathLabCta = document.createElement("a");
    mathLabCta.href = "math-lab-public.html";
    mathLabCta.className = "btn-secondary";
    mathLabCta.textContent = "Coba 5 Soal Gratis";
    heroActions.appendChild(mathLabCta);
  }
});
