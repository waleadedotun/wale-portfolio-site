// Small helpers: mobile menu, gallery filter, lightbox, footer year.
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Gallery filter
  var buttons = document.querySelectorAll(".filters button");
  var items = document.querySelectorAll(".gallery figure");
  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.getAttribute("data-filter");
      buttons.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      items.forEach(function (it) {
        it.hidden = !(f === "all" || it.getAttribute("data-cat") === f);
      });
    });
  });

  // Lightbox
  var box = document.getElementById("lightbox");
  if (box && items.length) {
    var img = box.querySelector("img");
    var cap = box.querySelector("figcaption");
    var close = function () { box.classList.remove("open"); };
    items.forEach(function (it) {
      it.addEventListener("click", function () {
        var src = it.querySelector("img");
        img.src = src.currentSrc || src.src;
        img.alt = src.alt;
        cap.textContent = it.querySelector("figcaption b").textContent;
        box.classList.add("open");
      });
    });
    box.addEventListener("click", function (e) { if (e.target !== img) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }
})();
