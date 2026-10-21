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

  // YouTube videos load only when played (keeps the page fast on mobile data)
  document.querySelectorAll(".yt").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + b.getAttribute("data-yt") + "?autoplay=1&rel=0";
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      f.title = b.getAttribute("aria-label");
      f.className = "yt-frame";
      b.replaceWith(f);
    });
  });

  // Lightbox
  var box = document.getElementById("lightbox");
  if (box && items.length) {
    var img = box.querySelector("img");
    var cap = box.querySelector("figcaption");
    var close = function () { box.classList.remove("open"); };
    items.forEach(function (it) {
      if (it.classList.contains("video")) return;
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
