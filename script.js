/* Monchichi Dressup - basic engine
   uses assets in assets/clothes/... as image files
*/

/* CONFIG: positions (relative to outfitLayer) and scales */
const SNAP_CONFIG = {
  "tops": {x: 30, y: 80, w: 260},
  "bottoms": {x: 30, y: 240, w: 260},
  "hats": {x: 80, y: 0, w: 160},
  "shoes": {x: 60, y: 360, w: 200}
};

/* elements */
const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const endScreen = document.getElementById("endScreen");

const monchichiWrap = document.getElementById("monchichiWrap");
const outfitLayer = document.getElementById("outfitLayer");

const topsEl = document.getElementById("tops");
const bottomsEl = document.getElementById("bottoms");
const hatsEl = document.getElementById("hats");
const shoesEl = document.getElementById("shoes");

const clearBtn = document.getElementById("clearBtn");
const doneBtn = document.getElementById("doneBtn");

const finalPreview = document.getElementById("finalPreview");
const endMsg = document.getElementById("endMsg");
const resultImg = document.getElementById("resultImg");
const restartBtn = document.getElementById("restartBtn");

/* asset lists (relative paths) - replace with your real file names */
const ASSETS = {
  tops: ["assets/clothes/tops/top1.svg","assets/clothes/tops/top2.svg","assets/clothes/tops/top3.svg"],
  bottoms: ["assets/clothes/bottoms/skirt1.svg","assets/clothes/bottoms/pants1.svg","assets/clothes/bottoms/pants2.svg"],
  hats: ["assets/clothes/hats/hat1.svg","assets/clothes/hats/hat2.svg","assets/clothes/hats/hat3.svg"],
  shoes: ["assets/clothes/shoes/shoe1.svg","assets/clothes/shoes/shoe2.svg","assets/clothes/shoes/shoe3.svg"]
};

/* current outfit state */
const state = {
  tops: null,
  bottoms: null,
  hats: null,
  shoes: null
};

/* pointer drag state */
let dragging = null; // {el, type, src, ghost}
let pointerOffset = {x:0,y:0};

startBtn.addEventListener("click", () => {
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  // start monchichi animation: slide in from left
  requestAnimationFrame(()=> {
    monchichiWrap.style.left = "10px"; // animate to visible
  });
});

/* populate wardrobe thumbnails */
function makeThumb(src,type){
  const img = document.createElement("img");
  img.src = src;
  img.draggable = false;
  img.dataset.type = type;
  img.dataset.src = src;
  img.addEventListener("pointerdown", onThumbPointerDown);
  return img;
}
function populate(){
  ASSETS.tops.forEach(s=>topsEl.appendChild(makeThumb(s,"tops")));
  ASSETS.bottoms.forEach(s=>bottomsEl.appendChild(makeThumb(s,"bottoms")));
  ASSETS.hats.forEach(s=>hatsEl.appendChild(makeThumb(s,"hats")));
  ASSETS.shoes.forEach(s=>shoesEl.appendChild(makeThumb(s,"shoes")));
}
populate();

/* pointer handlers for picking up a clothing item */
function onThumbPointerDown(e){
  e.preventDefault();
  const src = e.currentTarget.dataset.src;
  const type = e.currentTarget.dataset.type;
  startDrag(e, src, type);
}

/* create a ghost image that follows pointer */
function startDrag(e, src, type){
  if(dragging) return;
  const ghost = document.createElement("img");
  ghost.src = src;
  ghost.style.position = "fixed";
  ghost.style.width = "110px";
  ghost.style.height = "110px";
  ghost.style.pointerEvents = "none";
  ghost.style.zIndex = 9999;
  document.body.appendChild(ghost);
  dragging = {el: null, type, src, ghost};
  pointerOffset.x = 55;
  pointerOffset.y = 55;
  moveGhost(e.clientX, e.clientY);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
}

/* update ghost position */
function moveGhost(clientX, clientY){
  if(!dragging) return;
  dragging.ghost.style.left = (clientX - pointerOffset.x) + "px";
  dragging.ghost.style.top  = (clientY - pointerOffset.y) + "px";
}

/* pointer move */
function onPointerMove(e){
  moveGhost(e.clientX, e.clientY);
}

/* pointer up -> drop */
function onPointerUp(e){
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);

  // check if pointer is over monchichiWrap bounding rect
  const stageRect = monchichiWrap.getBoundingClientRect();
  if(e.clientX >= stageRect.left && e.clientX <= stageRect.right &&
     e.clientY >= stageRect.top && e.clientY <= stageRect.bottom){
    // snap to outfit layer according to type
    placeClothes(dragging.type, dragging.src);
  }
  // remove ghost
  if(dragging && dragging.ghost && dragging.ghost.parentNode) dragging.ghost.remove();
  dragging = null;
}

/* place clothes into outfitLayer, replacing existing of same type */
function placeClothes(type, src){
  // remove old of type
  const old = outfitLayer.querySelector(`img[data-type="${type}"]`);
  if(old) old.remove();

  const cfg = SNAP_CONFIG[type];
  const img = document.createElement("img");
  img.src = src;
  img.dataset.type = type;
  img.style.position = "absolute";
  img.style.left = cfg.x + "px";
  img.style.bottom = cfg.y + "px";
  img.style.width = cfg.w + "px";
  img.style.pointerEvents = "none";
  outfitLayer.appendChild(img);

  state[type] = src;
}

/* clear outfit */
clearBtn.addEventListener("click", ()=>{
  outfitLayer.innerHTML = "";
  state.tops = state.bottoms = state.hats = state.shoes = null;
});

/* done -> show final preview + confetti */
doneBtn.addEventListener("click", ()=>{
  // render final preview: clone monchichiWrap content to finalPreview
  finalPreview.innerHTML = "";
  const previewBox = document.createElement("div");
  previewBox.style.position = "relative";
  previewBox.style.width = "320px";
  previewBox.style.height = "420px";
  previewBox.style.background = "#fff";
  previewBox.style.borderRadius = "12px";
  previewBox.style.overflow = "hidden";
  previewBox.style.boxShadow = "0 10px 30px rgba(2,6,23,0.15)";

  const base = document.getElementById("monchichi").cloneNode();
  base.style.position = "absolute";
  base.style.left = "0px";
  base.style.bottom = "0px";
  base.style.width = "320px";
  base.style.zIndex = 1;
  previewBox.appendChild(base);

  // clone outfits
  const kids = outfitLayer.querySelectorAll("img");
  kids.forEach(k => {
    const copy = k.cloneNode();
    copy.style.position = "absolute";
    copy.style.left = k.style.left;
    copy.style.bottom = k.style.bottom;
    copy.style.width = k.style.width;
    copy.style.zIndex = 2;
    previewBox.appendChild(copy);
  });

  finalPreview.appendChild(previewBox);

  // show end screen
  gameScreen.classList.add("hidden");
  endScreen.classList.remove("hidden");
  endMsg.textContent = "Toll gestylt!";

  // confetti
  launchConfetti(30);
});

/* restart */
restartBtn.addEventListener("click", ()=> location.reload());

/* simple confetti generator */
function launchConfetti(count){
  const parent = finalPreview;
  for(let i=0;i<count;i++){
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = (Math.random()*100) + "%";
    c.style.background = randomColor();
    c.style.transform = `translateY(-20px) rotate(${Math.random()*360}deg)`;
    parent.appendChild(c);
    // animate
    const duration = 2000 + Math.random()*2000;
    c.animate([
      { transform:`translateY(-20px) rotate(0deg)`, opacity:1 },
      { transform:`translateY(${400 + Math.random()*200}px) rotate(${Math.random()*720}deg)`, opacity:0.9 }
    ], { duration: duration, easing: "cubic-bezier(.17,.67,.13,1)", iterations:1 });
    setTimeout(()=> c.remove(), duration+100);
  }
}
function randomColor(){
  const palette = ["#ff5d8f","#ffd166","#73d2de","#9be564","#a78bfa","#ffb3c6"];
  return palette[Math.floor(Math.random()*palette.length)];
}

/* Accessibility: prevent images dragging native behaviour */
document.addEventListener('dragstart', e => e.preventDefault());
