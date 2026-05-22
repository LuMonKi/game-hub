import {
  blackBishop,
  blackKnight,
  blackRook,
  blackQueen,
  whiteQueen,
  whiteRook,
  whiteKnight,
  whiteBishop,
} from "../Data/pieces.js";

// import { blackBishop } from "../Data/pieces.js";

class ModalCreator {
  constructor(body) {
    if (!body) {
      throw new Error("Выберете фигуру");
    }

    this.open = false;
    this.body = body;
  }

  show() {
    this.open = true;
    document.body.appendChild(this.body);
  

    setTimeout(() => {
      this.body.classList.add("show");
    }, 10);
    
    document.getElementById("root").classList.add("blur");
  }

  hide() {
    this.open = false;
  
    this.body.classList.remove("show");
  
    setTimeout(() => {
      document.body.removeChild(this.body);
    }, 500); 
  
    document.getElementById("root").classList.remove("blur");
  }
}

function pawnPromotion(color, callback, id) {
  const rook = document.createElement("img");
  rook.onclick = rookCallback;
  rook.src = `../Assets/images/pieces/preset1/${color}/rook.png`;
  rook.classList.add("pawnChoise")

  const knight = document.createElement("img");
  knight.onclick = knightCallback;
  knight.src = `../Assets/images/pieces/preset1/${color}/knight.png`;
  knight.classList.add("pawnChoise")

  const bishop = document.createElement("img");
  bishop.onclick = bishopCallback;
  bishop.src = `../Assets/images/pieces/preset1/preset1/${color}/bishop.png`;
  bishop.classList.add("pawnChoise")

  const queen = document.createElement("img");
  queen.onclick = queenCallback;
  queen.src = `../Assets/images/pieces/preset1/${color}/queen.png`;
  queen.classList.add("pawnChoise")

  const imageContainer = document.createElement("div");
  imageContainer.appendChild(rook);
  imageContainer.appendChild(knight);
  imageContainer.appendChild(bishop);
  imageContainer.appendChild(queen);

  const msg = document.createElement("p");
  msg.textContent = "Возможна смена статуса пешки";

  const finalContainer = document.createElement("div");
  finalContainer.appendChild(msg);
  finalContainer.appendChild(imageContainer);
  finalContainer.classList.add("modal");

  const modal = new ModalCreator(finalContainer);
  modal.show();

  // callbacks
  function rookCallback() {
    if (color == "white") {
      callback(whiteRook, id);
    } else {
      callback(blackRook, id);
    }
    modal.hide();
  }

  function knightCallback() {
    if (color == "white") {
      callback(whiteKnight, id);
    } else {
      callback(blackKnight, id);
    }
    modal.hide();
  }

  function bishopCallback() {
    if (color == "white") {
      callback(whiteBishop, id);
    } else {
      callback(blackBishop, id);
    }
    modal.hide();
  }

  function queenCallback() {
    if (color == "white") {
      callback(whiteQueen, id);
    } else {
      callback(blackQueen, id);
    }
    modal.hide();
  }
}

export default pawnPromotion;
