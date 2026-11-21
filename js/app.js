(() => {
  "use strict";

  const TESTS = window.KAN_TESTLERI || {};
  const $ = (id) => document.getElementById(id);
  const DEMO = "HGB:10.8;WBC:7.2;PLT:460;GLU:92;FER:9;VITD:18;TSH:2.1";
  const LABEL = { dusuk: "Düşük", normal: "Normal", yuksek: "Yüksek" };

  /* ---------------- Ekranlar ---------------- */
  function showHome() {
    $("results").hidden = true;
    $("home").hidden = false;
    window.scrollTo(0, 0);
  }
  function showResults(push = true) {
    $("home").hidden = true;
    $("results").hidden = false;
    window.scrollTo(0, 0);
    if (push && location.hash !== "#sonuc") history.pushState({ v: "sonuc" }, "", "#sonuc");
  }
  window.addEventListener("popstate", () => {
    if (!$("scanner").hidden) stopScanner();
    if (location.hash !== "#sonuc") showHome();
  });

  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 3200);
  }

  /* ---------------- QR içeriğini çözme ----------------
     Desteklenen biçimler (ayrıntı: QR-FORMATI.md):
       HGB:13.5;WBC:7.2;PLT:250
       HGB:13.5:12-16;WBC:7,2        (aralık isteğe bağlı, virgüllü ondalık olur)
       https://site.com/?t=HGB:13.5;WBC:7.2
       https://site.com/?hgb=13.5&wbc=7.2
       {"HGB":13.5,"WBC":{"v":7.2,"min":4,"max":10}}
  */
  const num = (s) => {
    if (s === undefined || s === null) return NaN;
    const n = parseFloat(String(s).trim().replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  };

  function parseRange(r) {
    if (!r) return null;
    const m = String(r).trim().match(/^([\d.,]+)\s*[-~–]\s*([\d.,]+)$/);
    if (!m) return null;
    const min = num(m[1]), max = num(m[2]);
    return Number.isFinite(min) && Number.isFinite(max) && max > min ? { min, max } : null;
  }

  function parseText(text) {
    const out = [];
    String(text).split(/[;\n|]+/).forEach((part) => {
      const m = part.trim().match(/^([A-Za-z0-9_]+)\s*[:=]\s*([\d.,]+)\s*(?:[:@]\s*(.+))?$/);
      if (!m) return;
      const v = num(m[2]);
      if (!Number.isFinite(v)) return;
      out.push({ code: m[1].toUpperCase(), value: v, range: parseRange(m[3]) });
    });
    return out;
  }

  function parsePayload(raw) {
    const text = String(raw || "").trim();
    if (!text) return [];

    if (text.startsWith("{")) {
      try {
        const obj = JSON.parse(text);
        return Object.keys(obj).map((k) => {
          const x = obj[k];
          if (typeof x === "object" && x) {
            const range = Number.isFinite(num(x.min)) && Number.isFinite(num(x.max)) && num(x.max) > num(x.min)
              ? { min: num(x.min), max: num(x.max) } : null;
            return { code: k.toUpperCase(), value: num(x.v ?? x.value ?? x.deger), range };
          }
          return { code: k.toUpperCase(), value: num(x), range: null };
        }).filter((r) => Number.isFinite(r.value));
      } catch (e) { return []; }
    }

    if (/^https?:\/\//i.test(text)) {
      try {
        const u = new URL(text);
        const t = u.searchParams.get("t") || u.searchParams.get("d") || decodeURIComponent(u.hash.replace(/^#/, ""));
        if (t && /[:=]/.test(t)) return parseText(t);
        const out = [];
        u.searchParams.forEach((val, key) => {
          const [v, r] = val.split(/[:@]/);
          if (Number.isFinite(num(v))) out.push({ code: key.toUpperCase(), value: num(v), range: parseRange(r) });
        });
        return out;
      } catch (e) { return []; }
    }

    return parseText(text);
  }

  function classify(value, min, max) {
    if (value < min) return "dusuk";
    if (value > max) return "yuksek";
    return "normal";
  }

  const fmt = (n) => Number(n).toLocaleString("tr-TR", { maximumFractionDigits: 2 });

  /* ---------------- Video ---------------- */
  function youtubeId(url) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
    return m ? m[1] : null;
  }

  function videoBlock(url, level, testName) {
    const wrap = document.createElement("div");
    wrap.className = "video-wrap";
    const u = (url || "").trim();

    if (!u || u === "*") {
      const soon = document.createElement("div");
      soon.className = "video-soon";
      soon.innerHTML = "<div><b>Video yakında</b></div>";
      soon.firstChild.append(`${testName} — ${LABEL[level].toLowerCase()} değer videosu hazırlanıyor.`);
      wrap.appendChild(soon);
      return wrap;
    }

    const yt = youtubeId(u);
    if (yt) {
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${yt}?rel=0&playsinline=1`;
      f.title = `${testName} — ${LABEL[level]}`;
      f.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      f.loading = "lazy";
      f.style.cssText = "width:100%;height:100%;border:0;display:block";
      wrap.appendChild(f);
      return wrap;
    }

    const v = document.createElement("video");
    v.src = u;
    v.controls = true;
    v.preload = "metadata";
    v.setAttribute("playsinline", "");
    v.setAttribute("aria-label", `${testName} — ${LABEL[level]} değer videosu`);
    wrap.appendChild(v);
    return wrap;
  }

  /* ---------------- Sonuçları çiz ---------------- */
  function render(items) {
    const list = $("resultList");
    list.textContent = "";
    const counts = { dusuk: 0, normal: 0, yuksek: 0 };
    const unknown = [];
    const order = Object.keys(TESTS);

    items
      .filter((it) => { if (!TESTS[it.code]) { unknown.push(it.code); return false; } return true; })
      .sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code))
      .forEach((it) => {
        const t = TESTS[it.code];
        const min = it.range ? it.range.min : t.min;
        const max = it.range ? it.range.max : t.max;
        const level = classify(it.value, min, max);
        counts[level]++;

        const pos = Math.max(3, Math.min(97, 25 + ((it.value - min) / (max - min)) * 50));

        const card = document.createElement("article");
        card.className = "result";
        card.innerHTML = `
          <div class="result-top">
            <h3></h3>
            <span class="pill ${level}">${LABEL[level]}</span>
            <div class="who"></div>
          </div>
          <div class="value"><b></b><span></span></div>
          <div class="range">
            <div class="bar" role="img"><i class="${level}" style="left:${pos}%"></i></div>
            <div class="range-labels"><span></span><span></span></div>
          </div>`;
        card.querySelector("h3").textContent = t.ad;
        card.querySelector(".who").textContent = t.calisan || "";
        card.querySelector(".value b").textContent = fmt(it.value);
        card.querySelector(".value span").textContent = t.birim;
        card.querySelector(".bar").setAttribute("aria-label", `Referans aralığı ${fmt(min)}–${fmt(max)} ${t.birim}, değeriniz ${fmt(it.value)}`);
        const [l1, l2] = card.querySelectorAll(".range-labels span");
        l1.textContent = fmt(min);
        l2.textContent = fmt(max);
        card.appendChild(videoBlock(t.videolar && t.videolar[level], level, t.ad));
        list.appendChild(card);
      });

    const sum = $("summary");
    sum.textContent = "";
    ["dusuk", "normal", "yuksek"].forEach((k) => {
      if (!counts[k]) return;
      const p = document.createElement("span");
      p.className = `pill ${k}`;
      p.textContent = `${counts[k]} ${LABEL[k].toLowerCase()}`;
      sum.appendChild(p);
    });

    const un = $("unknownList");
    if (unknown.length) {
      un.hidden = false;
      un.textContent = `Henüz tanımlanmamış değerler: ${[...new Set(unknown)].join(", ")}`;
    } else un.hidden = true;

    return counts.dusuk + counts.normal + counts.yuksek;
  }

  function handlePayload(raw, fromScanner) {
    const items = parsePayload(raw);
    const shown = render(items);
    if (!shown) {
      if (fromScanner) return false;
      toast("Bu QR kodda tanınan bir tahlil değeri bulunamadı.");
      return false;
    }
    showResults();
    return true;
  }

  /* ---------------- QR okuyucu ---------------- */
  let stream = null, rafId = 0, lastTick = 0, detector = null, busy = false, torchOn = false, lastBad = "";
  const canvas = $("work");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  async function getDetector() {
    if (detector !== null) return detector;
    detector = false;
    try {
      if ("BarcodeDetector" in window) {
        const formats = await window.BarcodeDetector.getSupportedFormats();
        if (formats.includes("qr_code")) detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      }
    } catch (e) { detector = false; }
    return detector;
  }

  async function decodeSource(source, w, h, thorough) {
    const det = await getDetector();
    if (det) {
      try {
        const codes = await det.detect(source);
        if (codes.length) return codes[0].rawValue;
      } catch (e) { /* jsQR ile devam */ }
    }
    if (!window.jsQR) return null;
    const maxSide = thorough ? 1400 : 720;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: thorough ? "attemptBoth" : "dontInvert" });
    return code ? code.data : null;
  }

  function scanError(msg) {
    const e = $("scanErr");
    e.textContent = msg;
    e.hidden = !msg;
  }

  function onFound(text) {
    if (navigator.vibrate) navigator.vibrate(60);
    const ok = handlePayload(text, true);
    if (ok) { stopScanner(true); return; }
    if (text !== lastBad) {
      lastBad = text;
      scanError("Bu QR kod bir tahlil sonucu içermiyor. Tahlil kağıdınızın köşesindeki QR kodu okutun.");
    }
  }

  async function tick(ts) {
    rafId = requestAnimationFrame(tick);
    const video = $("camera");
    if (busy || ts - lastTick < 140 || video.readyState < 2 || !video.videoWidth) return;
    lastTick = ts;
    busy = true;
    try {
      const text = await decodeSource(video, video.videoWidth, video.videoHeight, false);
      if (text) onFound(text);
    } finally { busy = false; }
  }

  async function startScanner() {
    $("scanner").hidden = false;
    document.body.style.overflow = "hidden";
    scanError("");
    lastBad = "";
    $("torchBtn").hidden = true;
    history.pushState({ v: "tara" }, "", location.hash === "#sonuc" ? "#sonuc-tara" : "#tara");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      scanError(location.protocol !== "https:" && location.hostname !== "localhost"
        ? "Kamera yalnızca güvenli (https) bağlantıda açılır. Şimdilik “Fotoğraftan oku” ile devam edebilirsiniz."
        : "Bu tarayıcı kameraya erişemiyor. “Fotoğraftan oku” ile devam edebilirsiniz.");
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      const video = $("camera");
      video.srcObject = stream;
      await video.play().catch(() => {});
      const track = stream.getVideoTracks()[0];
      const caps = track && track.getCapabilities ? track.getCapabilities() : {};
      if (caps && caps.torch) $("torchBtn").hidden = false;
      getDetector();
      rafId = requestAnimationFrame(tick);
    } catch (err) {
      const denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
      scanError(denied
        ? "Kamera izni verilmedi. Tarayıcı ayarlarından kamera iznini açın ya da “Fotoğraftan oku”yu kullanın."
        : "Kamera açılamadı. “Fotoğraftan oku” ile QR kodun fotoğrafını seçebilirsiniz.");
    }
  }

  function stopScanner(fromFound) {
    cancelAnimationFrame(rafId);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    torchOn = false;
    $("camera").srcObject = null;
    $("scanner").hidden = true;
    document.body.style.overflow = "";
    if (fromFound) {
      history.replaceState({ v: "sonuc" }, "", "#sonuc");
    } else if (/tara$/.test(location.hash)) {
      history.back();
    }
  }

  async function readFile(file) {
    if (!file) return;
    scanError("");
    try {
      let bmp;
      if ("createImageBitmap" in window) {
        bmp = await createImageBitmap(file);
      } else {
        bmp = await new Promise((res, rej) => {
          const img = new Image();
          img.onload = () => res(img);
          img.onerror = rej;
          img.src = URL.createObjectURL(file);
        });
      }
      const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
      const text = await decodeSource(bmp, w, h, true);
      if (text) onFound(text);
      else scanError("Fotoğrafta QR kod bulunamadı. Kodun net ve tamamının göründüğü bir fotoğraf deneyin.");
    } catch (e) {
      scanError("Fotoğraf okunamadı. Başka bir fotoğraf deneyin.");
    } finally {
      $("fileInput").value = "";
    }
  }

  $("scanBtn").addEventListener("click", startScanner);
  $("rescanBtn").addEventListener("click", startScanner);
  $("closeScan").addEventListener("click", () => stopScanner(false));
  $("fileInput").addEventListener("change", (e) => readFile(e.target.files[0]));
  $("demoBtn").addEventListener("click", () => handlePayload(DEMO));
  $("backBtn").addEventListener("click", () => (location.hash === "#sonuc" ? history.back() : showHome()));
  $("torchBtn").addEventListener("click", async () => {
    const track = stream && stream.getVideoTracks()[0];
    if (!track) return;
    try { torchOn = !torchOn; await track.applyConstraints({ advanced: [{ torch: torchOn }] }); } catch (e) { /* desteklenmiyor */ }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("scanner").hidden) stopScanner(false); });

  /* ---------------- Uygulama yükleme (PWA) ---------------- */
  const standalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!standalone()) {
      $("installBtn").hidden = false;
      $("installCard").hidden = false;
    }
  });
  $("installBtn").addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => {});
    deferredPrompt = null;
    $("installCard").hidden = true;
  });
  window.addEventListener("appinstalled", () => {
    $("installCard").hidden = true;
    toast("Uygulama ana ekranınıza eklendi.");
  });
  if (isIOS && !standalone()) {
    $("installText").textContent = "Safari’de alttaki Paylaş simgesine, ardından “Ana Ekrana Ekle”ye dokunun.";
    $("installBtn").hidden = true;
    $("installCard").hidden = false;
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  /* ---------------- Açılış: adres QR içeriyorsa doğrudan göster ----------------
     Telefonun kendi kamerasıyla okutulan QR (https://site/?t=...) uygulamayı açar. */
  const params = new URLSearchParams(location.search);
  if (params.get("ac") === "tara") {
    history.replaceState(null, "", location.pathname);
    startScanner();
  } else if (params.toString() && parsePayload(location.href).length) {
    const shown = render(parsePayload(location.href));
    if (shown) {
      history.replaceState(null, "", location.pathname);
      showResults(true);
    }
  } else if (location.hash) {
    history.replaceState(null, "", location.pathname);
  }
})();
