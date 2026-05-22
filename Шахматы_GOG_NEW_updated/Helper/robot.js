import { globalState, keySquareMapper } from "../index.js";
import { moveElement, clearSelection } from "../Events/global.js";
import {
  giveBishopHighlightIds,
  giveRookHighlightIds,
  giveKnightHighlightIds,
  giveKingHighlightIds,
  checkSquareCaptureId,
} from "./commonHelper.js";

const pieceValues = {
  PAWN: 1,
  KNIGHT: 3,
  BISHOP: 3,
  ROOK: 5,
  QUEEN: 9,
  KING: 1000,
};

function getMovesForPiece(piece) {
  const pos = piece.current_position;
  if (!pos) return [];

  const name = piece.piece_name;
  const color = name.includes("WHITE") ? "white" : "black";
  const colorUpper = color.toUpperCase();
  const targets = [];

  if (name.includes("PAWN")) {
    const dir = color === "white" ? 1 : -1;
    const startRow = color === "white" ? "2" : "7";
    const forward = `${pos[0]}${Number(pos[1]) + dir}`;

    if (keySquareMapper[forward] && !keySquareMapper[forward].piece) {
      targets.push(forward);
      if (pos[1] === startRow) {
        const double = `${pos[0]}${Number(pos[1]) + 2 * dir}`;
        if (keySquareMapper[double] && !keySquareMapper[double].piece) {
          targets.push(double);
        }
      }
    }

    [-1, 1].forEach((dx) => {
      const capId = `${String.fromCharCode(pos[0].charCodeAt(0) + dx)}${Number(pos[1]) + dir}`;
      const sq = keySquareMapper[capId];
      if (sq?.piece && !sq.piece.piece_name.includes(colorUpper)) {
        targets.push(capId);
      }
    });

  } else if (name.includes("KNIGHT")) {
    giveKnightHighlightIds(pos).forEach((id) => {
      const sq = keySquareMapper[id];
      if (sq && (!sq.piece || !sq.piece.piece_name.includes(colorUpper))) {
        targets.push(id);
      }
    });

  } else {
    let dirs;
    if (name.includes("BISHOP")) {
      dirs = giveBishopHighlightIds(pos);
    } else if (name.includes("ROOK")) {
      dirs = giveRookHighlightIds(pos);
    } else {
      dirs = { ...giveBishopHighlightIds(pos), ...giveRookHighlightIds(pos) };
    }

    const isKing = name.includes("KING");

    Object.values(dirs).forEach((arr) => {
      const limited = isKing ? arr.slice(0, 1) : arr;
      const empty = checkSquareCaptureId(limited);
      empty.forEach((id) => targets.push(id));

      const nextIdx = empty.length;
      if (nextIdx < limited.length) {
        const captureId = limited[nextIdx];
        const sq = keySquareMapper[captureId];
        if (sq?.piece && !sq.piece.piece_name.includes(colorUpper)) {
          targets.push(captureId);
        }
      }
    });
  }

  return targets;
}

function getAllPossibleMoves(color) {
  const moves = [];
  const colorUpper = color.toUpperCase();

  globalState.flat().forEach((square) => {
    if (!square.piece || !square.piece.piece_name.includes(colorUpper)) return;
    const piece = square.piece;
    getMovesForPiece(piece).forEach((to) => {
      moves.push({ piece, to });
    });
  });

  return moves;
}

function getBestMove() {
  const moves = getAllPossibleMoves("black");
  if (moves.length === 0) return null;

  let best = moves[0];
  let bestScore = -Infinity;

  moves.forEach((move) => {
    const sq = keySquareMapper[move.to];
    let score = 0;
    if (sq?.piece) {
      const type = sq.piece.piece_name.split("_")[1];
      score = pieceValues[type] || 0;
    }
    score += Math.random() * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  });

  return best;
}

function makeRobotMove() {
  const best = getBestMove();
  if (!best) return;
  clearSelection();
  moveElement(best.piece, best.to);
}

export { makeRobotMove };
