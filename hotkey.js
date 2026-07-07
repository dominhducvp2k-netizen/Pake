// hotkey.js — Thêm phím tắt bàn phím cho máy tính MathDa (chèn qua Pake --inject)
// Cho phép gõ 0-9, + - × ÷ . ( ) Enter Backspace Esc để bấm nút tương ứng trên trang.
(function () {
  "use strict";

  // Phím bàn phím -> các nhãn nút có thể có trên trang
  // (liệt kê nhiều biến thể vì trang có thể dùng ký tự khác nhau: dấu trừ, nhân, chia...)
  var KEY_TO_LABELS = {
    0: ["0"],
    1: ["1"],
    2: ["2"],
    3: ["3"],
    4: ["4"],
    5: ["5"],
    6: ["6"],
    7: ["7"],
    8: ["8"],
    9: ["9"],
    ".": [".", ","],
    "+": ["+"],
    "-": ["-", "−"], // - hoặc − (U+2212)
    "*": ["×", "*", "x"], // ×
    "/": ["÷", "/"], // ÷
    "(": ["("],
    ")": [")"],
    "=": ["="],
    Enter: ["="],
    Backspace: ["DEL", "Del", "DELETE", "⌫"],
    Delete: ["AC", "C", "CLEAR"],
    Escape: ["AC", "C", "CLEAR"],
  };

  function norm(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  function press(el) {
    var o = { bubbles: true, cancelable: true, view: window };
    el.dispatchEvent(new MouseEvent("mousedown", o));
    el.dispatchEvent(new MouseEvent("mouseup", o));
    el.dispatchEvent(new MouseEvent("click", o));
  }

  function clickByLabels(labels) {
    var els = document.querySelectorAll('button,[role="button"],div,span,td,a');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.querySelector('button,[role="button"]')) continue; // chỉ lấy nút "lá"
      var t = norm(el.textContent);
      for (var j = 0; j < labels.length; j++) {
        if (t === labels[j]) {
          press(el);
          return true;
        }
      }
    }
    return false;
  }

  document.addEventListener(
    "keydown",
    function (e) {
      var a = document.activeElement;
      if (
        a &&
        (a.tagName === "INPUT" ||
          a.tagName === "TEXTAREA" ||
          a.isContentEditable)
      )
        return;
      if (e.ctrlKey || e.altKey || e.metaKey) return; // chừa phím tắt hệ thống & --activation-shortcut
      var labels = KEY_TO_LABELS[e.key];
      if (!labels) return;
      if (clickByLabels(labels)) e.preventDefault();
    },
    true,
  );
})();
