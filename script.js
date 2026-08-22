(() => {
  "use strict";

  const menuButton = document.querySelector("[data-menu-button]");
  const navigation = document.querySelector("[data-navigation]");
  const header = document.querySelector("[data-header]");

  const closeMenu = () => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.querySelector(".sr-only").textContent = "Open navigation";
    navigation.classList.remove("open");
  };

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(willOpen));
      menuButton.querySelector(".sr-only").textContent = willOpen
        ? "Close navigation"
        : "Open navigation";
      navigation.classList.toggle("open", willOpen);
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
        menuButton.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) closeMenu();
    });
  }

  const updateHeader = () => {
    if (header) header.classList.toggle("scrolled", window.scrollY > 12);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const filters = [...document.querySelectorAll("[data-filter]")];
  const publications = [...document.querySelectorAll(".publication[data-year]")];
  const filterCount = document.querySelector("[data-filter-count]");

  const filterPublications = (filter) => {
    let visible = 0;

    publications.forEach((publication) => {
      const year = Number(publication.dataset.year);
      const show =
        filter === "all" ||
        String(year) === filter ||
        (filter === "earlier" && year <= 2023);

      publication.hidden = !show;
      if (show) visible += 1;
    });

    filters.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (filterCount) {
      filterCount.textContent = `Showing ${visible} of ${publications.length}`;
    }
  };

  filters.forEach((button) => {
    button.addEventListener("click", () => filterPublications(button.dataset.filter));
  });

  const sectionLinks = [...document.querySelectorAll('.primary-navigation a[href^="#"]')];
  const sectionById = new Map(
    sectionLinks
      .map((link) => [link.getAttribute("href").slice(1), link])
      .filter(([id]) => id)
  );

  if ("IntersectionObserver" in window && sectionById.size) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visibleEntries.length) return;
        const activeLink = sectionById.get(visibleEntries[0].target.id);
        if (!activeLink) return;

        sectionLinks.forEach((link) => link.classList.toggle("active", link === activeLink));
      },
      { rootMargin: "-20% 0px -65%", threshold: [0.05, 0.2, 0.5] }
    );

    sectionById.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  document.querySelectorAll("[data-year]").forEach((node) => {
    if (!node.classList.contains("publication")) {
      node.textContent = new Date().getFullYear();
    }
  });
})();
