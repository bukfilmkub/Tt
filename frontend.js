"use strict";

// ===== CONFIG SETTINGS =====
const wpilSettings = {
  trackAllElementClicks: true,             // ติดตามทุกลิงก์
  disableClicks: false,                    // ปิดการติดตามคลิกทั้งหมด
  openLinksWithJS: true,                   // เปิดลิงก์ด้วย JS
  openInternalInNewTab: true,              // เปิดลิงก์ภายในในแท็บใหม่
  openExternalInNewTab: true,              // เปิดลิงก์ภายนอกในแท็บใหม่
  ajaxUrl: "/track-link.php",              // เปลี่ยน path ให้ตรงกับไฟล์ PHP ที่รับข้อมูล
  i18n: {
    imageText: "รูปภาพ: ",
    imageNoText: "ลิงก์รูปภาพไม่มีข้อความ",
    noText: "ลิงก์ไม่มีข้อความ",
  },
};

// ===== EVENT BINDING =====
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", handleLinkClick);
    link.addEventListener("auxclick", handleLinkClick);
  });

  if (shouldOpenLinksInNewTab()) {
    openLinksInNewTab();
  }
});

function shouldOpenLinksInNewTab() {
  return wpilSettings.openLinksWithJS &&
    (wpilSettings.openInternalInNewTab || wpilSettings.openExternalInNewTab);
}

// ===== HANDLE LINK CLICK =====
function handleLinkClick(e) {
  const isLeftClick = e.button === 0 || e.which === 1;
  const isMiddleClick = e.button === 1 || e.which === 2;
  const link = e.currentTarget;

  if (!isLeftClick && !isMiddleClick) return;
  if (!link || !link.href || link.href === "#") return;
  if (wpilSettings.disableClicks) return;

  const anchorText = extractAnchorText(link);
  const location = detectLinkLocation(link);

  if (!wpilSettings.trackAllElementClicks && isInIgnoredContainer(link)) {
    return;
  }

  sendAjax({
    action: "link_clicked",
    link_url: link.href,
    link_anchor: anchorText,
    link_location: location,
  });
}

// ===== GET ANCHOR TEXT =====
function extractAnchorText(link) {
  const img = link.querySelector("img, svg");
  const text = link.textContent.trim();

  if (text) return text;
  if (img && img.title) return wpilSettings.i18n.imageText + img.title.trim();
  return img ? wpilSettings.i18n.imageNoText : wpilSettings.i18n.noText;
}

// ===== OPEN LINKS IN NEW TAB =====
function openLinksInNewTab() {
  document.querySelectorAll("a").forEach(link => {
    if (isInIgnoredContainer(link)) return;
    if (!link.href || link.target || link.href.includes("#")) return;

    const linkURL = new URL(link.href, window.location.href);
    const isInternal = linkURL.hostname === window.location.hostname;

    if (
      (isInternal && wpilSettings.openInternalInNewTab) ||
      (!isInternal && wpilSettings.openExternalInNewTab)
    ) {
      link.setAttribute("target", "_blank");
    }
  });
}

// ===== AJAX FUNCTION =====
function sendAjax(data) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", wpilSettings.ajaxUrl, true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

  const encoded = Object.keys(data)
    .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&");

  xhr.send(encoded);
}

// ===== LINK LOCATION DETECTION =====
function detectLinkLocation(el) {
  const sectionMap = {
    "Search": ["#search", ".search"],
    "Header": ["header", "#header", ".header"],
    "Comment Section": ["#comment", ".comment"],
    "Footer": ["footer", "#footer", ".footer"],
    "Menu": ["#menu", ".menu"],
    "Navigation": ["nav"],
    "Sidebar": ["#sidebar", ".sidebar", "#widget", ".widget"],
    "Body Content": ["main", "article", ".main"]
  };

  while (el && el !== document.body) {
    for (const [section, selectors] of Object.entries(sectionMap)) {
      if (selectors.some(selector => el.matches(selector))) {
        return section;
      }
    }
    el = el.parentElement;
  }
  return "Body Content";
}

// ===== CHECK IF IN IGNORED AREA =====
function isInIgnoredContainer(el) {
  const ignoreSelectors = [
    "header", "footer", "nav",
    "[id*=header]", "[id*=menu]", "[id*=footer]", "[id*=widget]", "[id*=comment]",
    "[class*=header]", "[class*=menu]", "[class*=footer]", "[class*=widget]", "[class*=comment]",
    "#wpadminbar"
  ];

  while (el && el !== document.body) {
    if (ignoreSelectors.some(selector => el.matches(selector))) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}
