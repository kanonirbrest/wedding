(function () {
  var EVENT = new Date(2026, 7, 29, 16, 0, 0);
  var root = document.getElementById("countdown");
  var doneEl = document.getElementById("countdown-done");
  var elDays = document.getElementById("cd-days");
  var elHours = document.getElementById("cd-hours");
  var elMins = document.getElementById("cd-mins");
  var elSecs = document.getElementById("cd-secs");
  var lbDays = document.getElementById("cd-days-label");
  var lbHours = document.getElementById("cd-hours-label");
  var lbMins = document.getElementById("cd-mins-label");
  var lbSecs = document.getElementById("cd-secs-label");

  if (!root || !doneEl || !elDays || !elHours || !elMins || !elSecs) return;

  function ruPlural(n, one, few, many) {
    var a = Math.abs(Math.floor(n)) % 100;
    var b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function tick() {
    var diff = EVENT.getTime() - Date.now();
    if (diff <= 0) {
      root.hidden = true;
      doneEl.hidden = false;
      return;
    }
    root.hidden = false;
    doneEl.hidden = true;

    var s = Math.floor(diff / 1000);
    var days = Math.floor(s / 86400);
    s %= 86400;
    var hours = Math.floor(s / 3600);
    s %= 3600;
    var mins = Math.floor(s / 60);
    var secs = s % 60;

    elDays.textContent = String(days);
    elHours.textContent = pad2(hours);
    elMins.textContent = pad2(mins);
    elSecs.textContent = pad2(secs);
    lbDays.textContent = ruPlural(days, "день", "дня", "дней");
    lbHours.textContent = ruPlural(hours, "час", "часа", "часов");
    lbMins.textContent = ruPlural(mins, "минута", "минуты", "минут");
    lbSecs.textContent = ruPlural(secs, "секунда", "секунды", "секунд");
  }

  tick();
  setInterval(tick, 1000);
})();

(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var rafId = null;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function cancelSmoothScroll() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function smoothScrollTo(targetY) {
    cancelSmoothScroll();
    var startY = window.pageYOffset || document.documentElement.scrollTop || 0;
    var diff = targetY - startY;
    if (Math.abs(diff) < 2) return;
    var duration = Math.min(3400, Math.max(1000, Math.abs(diff) * 0.75));
    var start = performance.now();

    function step(now) {
      var t = Math.min(1, (now - start) / duration);
      window.scrollTo(0, Math.round(startY + diff * easeOutCubic(t)));
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = null;
      }
    }
    rafId = requestAnimationFrame(step);
  }

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) !== "#" || href.length < 2) return;
      if (a.target && a.target !== "_self") return;
      var id = href.slice(1);
      if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) return;
      var el = document.getElementById(id);
      if (!el) return;

      e.preventDefault();
      var pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      var y = el.getBoundingClientRect().top + window.pageYOffset - pad;
      smoothScrollTo(Math.max(0, y));
      if (history.pushState) {
        history.pushState(null, "", href);
      } else {
        window.location.hash = href;
      }
    },
    false
  );
})();

(function () {
  var GOOGLE_ACTION =
    "https://docs.google.com/forms/d/e/1FAIpQLSf0cEIxWObF_ygQ8I200GgJb5bJmXvnVmhfmUZIFqcdC8LPeQ/formResponse";
  var ENTRY = {
    imya: "entry.1242677980",
    familiya: "entry.1879211605",
    attending: "entry.209092778",
    kolichestvo: "entry.664345240",
  };

  var form = document.getElementById("guest-form");
  var msg = document.getElementById("form-message");
  var kolichestvo = document.getElementById("kolichestvo");
  var submitBtn = document.getElementById("guest-form-submit");

  if (!form || !msg || !kolichestvo) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    msg.textContent = "";

    var data = new FormData(form);
    var attending = data.get("attending");
    var imya = (data.get("imya") || "").trim();
    var familiya = (data.get("familiya") || "").trim();
    var rawCount = (data.get("kolichestvo") || "").trim().replace(/\s/g, "");
    var n = /^\d+$/.test(rawCount) ? parseInt(rawCount, 10) : NaN;

    if (!imya) {
      msg.textContent = "Укажите имя.";
      return;
    }
    if (!familiya) {
      msg.textContent = "Укажите фамилию.";
      return;
    }
    if (!attending) {
      msg.textContent = "Выберите «Я приду» или «Я не приду».";
      return;
    }
    if (!rawCount || Number.isNaN(n)) {
      msg.textContent = "Укажите количество персон (только цифры).";
      kolichestvo.setAttribute("aria-invalid", "true");
      return;
    }
    if (n < 0 || n > 99) {
      msg.textContent = "Количество персон — от 0 до 99.";
      kolichestvo.setAttribute("aria-invalid", "true");
      return;
    }
    if (attending === "Да" && n < 1) {
      msg.textContent = "Если вы придёте, укажите число персон не меньше 1.";
      kolichestvo.setAttribute("aria-invalid", "true");
      return;
    }

    kolichestvo.removeAttribute("aria-invalid");

    var proxy = document.createElement("form");
    proxy.action = GOOGLE_ACTION;
    proxy.method = "POST";
    proxy.target = "rsvp-google-target";
    proxy.hidden = true;

    [["imya", imya], ["familiya", familiya], ["attending", attending], ["kolichestvo", String(n)]].forEach(
      function (pair) {
        var inp = document.createElement("input");
        inp.type = "hidden";
        inp.name = ENTRY[pair[0]];
        inp.value = pair[1];
        proxy.appendChild(inp);
      }
    );

    document.body.appendChild(proxy);
    if (submitBtn) submitBtn.disabled = true;
    proxy.submit();
    document.body.removeChild(proxy);

    form.reset();
    msg.textContent = "Спасибо! Ответ отправлен.";
    if (submitBtn) {
      setTimeout(function () {
        submitBtn.disabled = false;
      }, 2000);
    }
  });
})();

(function () {
  var header = document.getElementById("site-header");
  var toggle = document.getElementById("site-nav-toggle");
  var panel = document.getElementById("site-nav-panel");
  if (!header || !toggle || !panel) return;

  var links = panel.querySelectorAll("a[href^='#']");
  var supportsInert = "inert" in HTMLElement.prototype;

  function setOpen(open) {
    header.classList.toggle("is-nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Закрыть меню разделов" : "Открыть меню разделов");
    if (supportsInert) {
      panel.inert = !open;
    } else {
      links.forEach(function (a) {
        if (open) a.removeAttribute("tabindex");
        else a.setAttribute("tabindex", "-1");
      });
    }
  }

  setOpen(false);

  toggle.addEventListener("click", function () {
    setOpen(!header.classList.contains("is-nav-open"));
  });

  links.forEach(function (a) {
    a.addEventListener("click", function () {
      setOpen(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header.classList.contains("is-nav-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener("click", function (e) {
    if (!header.classList.contains("is-nav-open")) return;
    var t = e.target;
    if (t instanceof Node && !header.contains(t)) setOpen(false);
  });
})();

(function () {
  if (typeof Swiper === "undefined") return;
  var el = document.querySelector("#dresscode-swiper");
  if (!el) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  new Swiper(el, {
    loop: true,
    speed: reduceMotion ? 0 : 1100,
    spaceBetween: 14,
    slidesPerView: 1,
    grabCursor: true,
    roundLengths: true,
    navigation: {
      nextEl: el.querySelector(".swiper-button-next"),
      prevEl: el.querySelector(".swiper-button-prev"),
    },
    pagination: {
      el: el.querySelector(".swiper-pagination"),
      clickable: true,
      dynamicBullets: true,
      dynamicMainBullets: 4,
    },
    keyboard: { enabled: true },
    a11y: {
      enabled: true,
      prevSlideMessage: "Предыдущий пример образа",
      nextSlideMessage: "Следующий пример образа",
      firstSlideMessage: "Это первый слайд",
      lastSlideMessage: "Это последний слайд",
      paginationBulletMessage: "Перейти к слайду {{index}}",
    },
  });
})();

(function () {
  var wrap = document.querySelector(".page-bg-video");
  var v = document.querySelector(".page-bg-video__video");
  var img = document.querySelector(".page-bg-video__gif");
  if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;

  function showGifFallback() {
    if (!wrap || !img) return;
    if (wrap.classList.contains("page-bg-video--use-gif")) return;
    var url = img.getAttribute("data-src");
    if (!url) return;
    img.setAttribute("src", url);
    wrap.classList.add("page-bg-video--use-gif");
  }

  function tryPlay(afterUserGesture) {
    var p = v.play();
    if (!p || typeof p.catch !== "function") return;
    p.catch(function () {
      if (afterUserGesture) showGifFallback();
    });
  }

  tryPlay(false);
  ["touchstart", "pointerdown", "click"].forEach(function (ev) {
    document.addEventListener(
      ev,
      function () {
        tryPlay(true);
      },
      { passive: true, once: true }
    );
  });

  v.addEventListener("error", showGifFallback);
})();
