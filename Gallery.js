// JavaScript Document
let today= new Date();
let bg = document.getElementById("dark-mode");
let words = document.getElementsByClassName("dark-mode-word");

if(today.getHours() > 17 || today.getHours() < 7){
	console.log("Night time, Dark mode");
	bg.style.backgroundColor = "#f2f2f2";
	for (let word of words){
		word.style.color = "white";
	}
}

// for the scroll up button
let mybutton = document.getElementById("Btn");
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
    if (document.body.scrollTop > 20 ||
    document.documentElement.scrollTop > 20) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
}

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

//-----------------------------Image gallery fn's ----------------------
let imagesContainer = document.querySelector('.scrollable-images');
let images = document.querySelectorAll('.scrollable-images img');
let modal = document.getElementById('myModal');
let modalImg = document.getElementById('modalImage');
let captionText = document.getElementById('caption');

let scrollPosition = 0;
let imageIndex = 0; 
function openModal(src, alt) {
  modal.style.display = window.innerWidth <= 768 ? 'flex' : 'block';
  modalImg.src = src;
  captionText.innerHTML = alt;
}

function closeModal() {
  modal.style.display = 'none';
}

// Block modal opens during the initial scroll-snap positioning phase on mobile
let pageReady = false;
setTimeout(function () { pageReady = true; }, 500);

images.forEach(function (img, index) {
  img.setAttribute('draggable', 'false');

  img.onload = function () {
    updateImagePositions();
  };

  img.onclick = function () {
    if (!pageReady) return;
    openModal(this.src, this.alt);
    imageIndex = index;
  };
});

imagesContainer.addEventListener('wheel', function (e) {
  scrollPosition += e.deltaY;
  scrollPosition = Math.min(imagesContainer.scrollWidth - imagesContainer.clientWidth, Math.max(0, scrollPosition));
  imagesContainer.scrollLeft = scrollPosition;
  imageIndex = Math.round(scrollPosition / images[0].offsetWidth);
  e.preventDefault();
});

imagesContainer.addEventListener('mousewheel', function (e) {
  scrollPosition += e.deltaY;
  scrollPosition = Math.min(imagesContainer.scrollWidth - imagesContainer.clientWidth, Math.max(0, scrollPosition));
  imagesContainer.scrollLeft = scrollPosition;
  imageIndex = Math.round(scrollPosition / images[0].offsetWidth);
  e.preventDefault();
});

window.addEventListener('resize', updateImagePositions);

function updateImagePositions() {
  const centerIndex = Math.floor(images.length / 2);
  scrollPosition = centerIndex * images[0].offsetWidth - imagesContainer.offsetWidth / 2;
  scrollPosition = Math.min(imagesContainer.scrollWidth - imagesContainer.clientWidth, Math.max(0, scrollPosition));
  imagesContainer.scrollLeft = scrollPosition;
  imageIndex = centerIndex;
}
updateImagePositions();

const dockContainer = document.querySelector('.scrollable-images');
const dockItems = document.querySelectorAll('.scrollable-images img');
const defaultItemScale = 1;
const hoverItemScale = 1.3; 
const defaultMargin = "5px";
const expandMargin = "10px";

const updateDockItems = (hoveredItemIndex) => {
  dockItems.forEach((item, index) => {
    let scale = defaultItemScale;
    let margin = defaultMargin;

    if (index === hoveredItemIndex) {
      scale = hoverItemScale;
      margin = expandMargin;
    } 

    item.style.transform = `scale(${scale})`;
    item.style.margin = `0 ${margin}`;
  });
};
dockItems.forEach((item, index) => {
  item.addEventListener("mouseenter", () => {
    updateDockItems(index);
  });
});
dockContainer.addEventListener("mouseleave", () => {
  resetDockItems();
});
const resetDockItems = () => {
  dockItems.forEach((item) => {
    item.style.transform = "";
    item.style.margin = "";
  });
};
document.addEventListener('keydown', function(event) {
  if (event.keyCode === 27) {
    closeModal(); 
  }
});