// window.initAccordion = function () {
//   const panels = document.querySelectorAll(".panel");

//   panels.forEach(panel => {
//     const header = panel.querySelector(".panel-header");

//     header.addEventListener("click", () => {
//       panels.forEach(p => {
//         p.classList.toggle("open", p === panel);
//       });
//     });
//   });

//   if (panels[0]) panels[0].classList.add("open");
// };

window.initAccordion = function () {
  const panels = document.querySelectorAll(".panel");

  panels.forEach(panel => {
    const header = panel.querySelector(".panel-header");

    // Toggle open/closed individually
    header.addEventListener("click", () => {
      panel.classList.toggle("open");
    });

    // Start all panels open
    panel.classList.add("open");
  });
};
