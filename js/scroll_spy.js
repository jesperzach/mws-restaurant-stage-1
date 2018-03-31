let lastScrollTop = 0;
const fixedElement = document.getElementById("filter-options");
const scrollableElement = document.querySelector("main");

scrollableElement.addEventListener("scroll", event => {
  const currentScrollTop = scrollableElement.scrollTop;
  const fixpoint = window.innerWidth < 600 ? 250 : 400;

  // Return if fixpoint has not been crossed:
  if (
    (currentScrollTop >= fixpoint && lastScrollTop >= fixpoint) ||
    (currentScrollTop < fixpoint && lastScrollTop < fixpoint)
  ) return;

  if (currentScrollTop >= fixpoint) {
    fixedElement.classList.add("fixed");
    return lastScrollTop = currentScrollTop;
  }

  if (currentScrollTop < fixpoint) {
    fixedElement.classList.remove("fixed");
    return lastScrollTop = currentScrollTop;
  }
});
