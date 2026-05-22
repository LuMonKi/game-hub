import { initGame } from "./Data/data.js";
import { GlobalEvent } from "./Events/global.js";
import { initGameRender } from "./Render/main.js";
import { makeRobotMove } from "./Helper/robot.js";

const globalState = initGame();
let keySquareMapper = {};
let moveHistory = [];

globalState.flat().forEach((square) => {
  keySquareMapper[square.id] = square;
});

initGameRender(globalState);
GlobalEvent();

String.prototype.replaceAt = function (index, replacement) {
  return (
    this.substring(0, index) +
    replacement +
    this.substring(index + replacement.length)
  );
};

function getPieceNameFromType(pieceName) {
  if (pieceName.includes("PAWN")) return "пешка";
  if (pieceName.includes("ROOK")) return "ладья";
  if (pieceName.includes("KNIGHT")) return "конь";
  if (pieceName.includes("BISHOP")) return "слон";
  if (pieceName.includes("QUEEN")) return "ферзь";
  if (pieceName.includes("KING")) return "король";
  return "фигура";
}

function addMoveToHistory(piece, from, to) {
  if (!from || !to) return;
  const pieceType = piece.piece_name.includes("WHITE") ? "Белая" : "Чёрная";
  const pieceName = getPieceNameFromType(piece.piece_name);
  const text = `${pieceType} ${pieceName}: ${from} → ${to}`;
  moveHistory.push(text);
  window.chessVue?.addMove(text);
}

function updateMoveHistoryDisplay() {}

document.addEventListener("chessPieceMoved", (e) => {
  const { piece, from, to } = e.detail;
  addMoveToHistory(piece, from, to);
});

function flipChessBoard() {
  const chessBoard = document.querySelector(".Chest_Root");
  if (!chessBoard) return;
  chessBoard.classList.toggle("flipped");
  chessBoard.querySelectorAll(".piece").forEach((piece) => {
    piece.style.transform = chessBoard.classList.contains("flipped")
      ? "rotate(180deg)"
      : "rotate(0deg)";
  });
}

document.getElementById("flipBoardButton").addEventListener("click", flipChessBoard);

let currentPreset = "preset1";

function switchPieceImages() {
  if (currentPreset === "preset1") currentPreset = "preset2";
  else if (currentPreset === "preset2") currentPreset = "preset3";
  else currentPreset = "preset1";

  document.querySelectorAll(".piece").forEach((piece) => {
    const newSrc = piece.getAttribute("src").replace(/preset\d+/, currentPreset);
    piece.setAttribute("src", newSrc);
  });
}

document.getElementById("switchPiecesButton").addEventListener("click", switchPieceImages);

let aiEnabled = false;

document.getElementById("aiButton").addEventListener("click", () => {
  aiEnabled = !aiEnabled;
  document.getElementById("aiButton").style.outline = aiEnabled ? "2px solid lime" : "";
});

document.addEventListener("chessTurnChanged", (e) => {
  window.chessVue?.setTurn(e.detail.inTurn);
  if (aiEnabled && e.detail.inTurn === "black") {
    setTimeout(makeRobotMove, 400);
  }
});

export { addMoveToHistory, updateMoveHistoryDisplay, globalState, keySquareMapper };
