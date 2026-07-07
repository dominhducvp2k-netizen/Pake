// hotkey.js v2 — Phím tắt ĐẦY ĐỦ 3 LỚP cho máy tính CalcES (mô phỏng Casio fx-580VN X)
// trên trang https://mathda.com/calculator/vi — chèn vào app Scalculator qua Pake --inject.
//
// THIẾT KẾ (đã chốt với người dùng):
//   • Số 0-9 và + - * / , Del, Backspace : trang gốc ĐÃ tự gõ được -> KHÔNG đụng (tránh nhập lặp).
//   • Nút hàm/chữ (sin, cos, √, x²...) : gán F1..F12.
//   • Nút tiện ích (Ans, RCL, CALC...) : gán chữ cái.
//   • Lớp VÀNG (SHIFT) : gõ phím dẫn '['  rồi bấm phím -> script tự bấm nút SHIFT rồi bấm nút đó.
//   • Lớp ĐỎ  (ALPHA) : gõ phím dẫn ']'  rồi bấm phím -> script tự bấm nút ALPHA rồi bấm nút đó.
//
// => Không cần liệt kê từng chức năng phụ: cứ "phím dẫn + nút gốc" là ra lớp vàng/đỏ của nút đó,
//    y hệt thao tác trên máy Casio thật (bấm SHIFT/ALPHA trước rồi bấm nút).
(function () {
  "use strict";

  // === BASE: phím bàn phím -> nhãn nút GỐC (lớp trắng) trên trang ===
  // Mỗi nút liệt kê NHIỀU nhãn ứng viên để tăng khả năng khớp (trang có thể dùng ký tự khác nhau).
  // Nút ký hiệu (√, x², x^, x⁻¹, ×10ˣ, log cơ số) có nhãn không chắc -> nếu không ăn, sửa mảng tương ứng.
  var BASE = {
    // --- Nút hàm/chữ: F1..F12 ---
    F1: ["sin"],
    F2: ["cos"],
    F3: ["tan"],
    F4: ["log"],
    F5: ["ln"],
    F6: ["√", "√▪", "√□", "√ ", "√"], // căn bậc hai
    F7: ["x²", "x2", "x^2", "x²"], // bình phương
    F8: ["x▪", "x^", "x□", "xᵇ", "x■"], // lũy thừa x^n
    F9: ["x⁻¹", "x-1", "x^-1", "x⁻¹"], // nghịch đảo
    F10: ["log▪", "log□", "logᵇ", "log□"], // log cơ số bất kỳ
    F11: ["hyp"],
    F12: ["×10ˣ", "×10", "x10", "×10ˣ"], // ×10^x (EXP)

    // --- Nút tiện ích: chữ cái gợi nhớ ---
    a: ["Ans"],
    r: ["RCL"],
    g: ["ENG"],
    d: ["S⇔D", "S<=>D", "S⟷D", "S⇔D"],
    m: ["M+"],
    c: ["CALC"],
    u: ["(−)", "(-)", "−", "(−)"], // dấu ÂM (unary minus)
    o: ["°’”", "°", "DMS", "°’”"], // độ-phút-giây

    // --- Dấu bấm trực tiếp ---
    ".": ["•", ".", ",", "•"], // dấu phẩy thập phân
    "(": ["("],
    ")": [")"],
    "=": ["="],
    Enter: ["="],
    Escape: ["AC", "C", "CLEAR"],

    // --- Số & phép tính: CHỈ để nhắm cho lớp phụ (dùng sau phím dẫn), KHÔNG bắt khi gõ trực tiếp ---
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
    "+": ["+"],
    "-": ["-", "−", "−"],
    "*": ["×", "*", "x", "×"],
    "/": ["÷", "/", "÷"],
  };

  // Phím KHÔNG bắt khi gõ trực tiếp (để trang gốc tự lo) — nhưng vẫn dùng được sau phím dẫn.
  var NATIVE_DIRECT = {
    0: 1,
    1: 1,
    2: 1,
    3: 1,
    4: 1,
    5: 1,
    6: 1,
    7: 1,
    8: 1,
    9: 1,
    "+": 1,
    "-": 1,
    "*": 1,
    "/": 1,
    Backspace: 1,
    Delete: 1,
  };

  var SHIFT_LEADER = "["; // lớp VÀNG (SHIFT)
  var ALPHA_LEADER = "]"; // lớp ĐỎ  (ALPHA)
  var pending = null; // 'SHIFT' | 'ALPHA' | null
  var pendingAt = 0;
  var LEADER_TIMEOUT = 2000; // ms: quá lâu thì huỷ phím dẫn

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

      // Hết hạn phím dẫn cũ
      if (pending && Date.now() - pendingAt > LEADER_TIMEOUT) pending = null;

      // Bấm phím dẫn -> ghi nhớ lớp, chờ phím kế tiếp
      if (e.key === SHIFT_LEADER) {
        pending = "SHIFT";
        pendingAt = Date.now();
        e.preventDefault();
        return;
      }
      if (e.key === ALPHA_LEADER) {
        pending = "ALPHA";
        pendingAt = Date.now();
        e.preventDefault();
        return;
      }

      var labels = BASE[e.key];

      // Đang chờ sau phím dẫn: bấm nút SHIFT/ALPHA trước rồi bấm nút gốc
      if (pending) {
        var mod = pending === "SHIFT" ? ["SHIFT"] : ["ALPHA"];
        pending = null;
        if (!labels) return; // phím này chưa gán nút gốc
        if (clickByLabels(mod)) {
          // bấm được nút SHIFT/ALPHA
          clickByLabels(labels); // rồi bấm nút đích
          e.preventDefault();
        }
        return;
      }

      // Gõ trực tiếp (lớp chính)
      if (NATIVE_DIRECT[e.key]) return; // số & phép tính: để trang gốc lo
      if (!labels) return;
      if (clickByLabels(labels)) e.preventDefault();
    },
    true,
  );
})();
