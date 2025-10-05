document.addEventListener("DOMContentLoaded", () => {
	const navToggle = document.querySelector(".nav-toggle");
	const navMenu = document.getElementById("nav-menu");
	const header = document.querySelector(".site-header");
	const yearSpan = document.getElementById("year");

	if (yearSpan) {
		yearSpan.textContent = new Date().getFullYear();
	}

	if (navToggle && navMenu) {
		const toggleMenu = () => {
			const isOpen = navMenu.classList.toggle("is-open");
			navToggle.setAttribute("aria-expanded", String(isOpen));
		};

		navToggle.addEventListener("click", (event) => {
			event.stopPropagation();
			toggleMenu();
		});

		navMenu.querySelectorAll("a").forEach((link) => {
			link.addEventListener("click", () => {
				if (window.innerWidth <= 900 && navMenu.classList.contains("is-open")) {
					toggleMenu();
				}
			});
		});

		document.addEventListener("click", (event) => {
			if (
				navMenu.classList.contains("is-open") &&
				!navMenu.contains(event.target)
			) {
				navMenu.classList.remove("is-open");
				navToggle.setAttribute("aria-expanded", "false");
			}
		});

		window.addEventListener("resize", () => {
			if (window.innerWidth > 900 && navMenu.classList.contains("is-open")) {
				navMenu.classList.remove("is-open");
				navToggle.setAttribute("aria-expanded", "false");
			}
		});
	}

	const internalLinks = document.querySelectorAll('a[href^="#"]');

	internalLinks.forEach((link) => {
		link.addEventListener("click", (event) => {
			const targetId = link.getAttribute("href");
			if (!targetId || targetId === "#") {
				return;
			}

			const target = document.querySelector(targetId);
			if (!target) {
				return;
			}

			event.preventDefault();

			// Offset scroll to account for the sticky header height.
			const offset = (header?.offsetHeight || 0) + 16;
			const top = target.getBoundingClientRect().top + window.scrollY - offset;

			window.scrollTo({ top, behavior: "smooth" });
		});
	});
});
