const changePic = () => {
  const pic = document.getElementById("pic");
  if (pic) {
    const n = Math.random();
    const filename = n < 0.33 ? "daz" : n < 0.67 ? "muppet" : "simpsons";
    const unique = Date.now();
    pic.setAttribute("src", `images/${filename}.webp?cb=${unique}`);
  }
};

document.addEventListener("turbo:load", () => {
  changePic();
  const pic = document.getElementById("pic");
  if (!pic) return;
  pic.addEventListener("click", changePic);
  let touchStartX = 0;
  pic.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  pic.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const deltaX = touchEndX - touchStartX;

    if (deltaX > 50) {
      changePic();
    }
  });
});
