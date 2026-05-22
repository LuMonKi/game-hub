// black pieces
function blackPawn(current_position) {
  return {
    current_position,
    img: "Assets/images/pieces/preset1/black/pawn.png",
    piece_name: "BLACK_PAWN",
  };
}
function blackBishop(current_position) {
  return {
    current_position,
    img: "Assets/images/pieces/preset1/black/bishop.png",
    piece_name: "BLACK_BISHOP",
  };
}
function blackKnight(current_position) {
  return {
    current_position,
    img: "Assets/images/pieces/preset1/black/knight.png",
    piece_name: "BLACK_KNIGHT",
  };
}
function blackKing(current_position) {
  return {
    move: false,
    current_position,
    img: "Assets/images/pieces/preset1/black/king.png",
    piece_name: "BLACK_KING",
  };
}
function blackQueen(current_position) {
  return {
    current_position,
    img: "Assets/images/pieces/preset1/black/queen.png",
    piece_name: "BLACK_QUEEN",
  };
}
function blackRook(current_position) {
  return {
    move: false,
    current_position,
    img: "Assets/images/pieces/preset1/black/rook.png",
    piece_name: "BLACK_ROOK",
  };
}

// white pieces
function whitePawn(current_position) {
  return {
    current_position,
    img: "Assets/images/pieces/preset1/white/pawn.png",
    piece_name: "WHITE_PAWN",
  };
}
function whiteRook(current_position) {
  return {
    move: false,
    current_position,
    img: "Assets/images/pieces/preset1/white/rook.png",
    piece_name: "WHITE_ROOK",
  };
}
function whiteKnight(current_position) {
  return {
    current_position,
    img: "Assets/images/pieces/preset1/white/knight.png",
    piece_name: "WHITE_KNIGHT",
  };
}
function whiteBishop(current_position) {
  return {
    current_position,
    img: "Assets/images/pieces/preset1/white/bishop.png",
    piece_name: "WHITE_BISHOP",
  };
}
function whiteQueen(current_position) {
  return {
    current_position,
    img: "Assets/images/pieces/preset1/white/queen.png",
    piece_name: "WHITE_QUEEN",
  };
}
function whiteKing(current_position) {
  return {
    move: false,
    current_position,
    img: "Assets/images/pieces/preset1/white/king.png",
    piece_name: "WHITE_KING",
  };
}

export {
  blackPawn,
  blackBishop,
  blackKing,
  blackQueen,
  blackKnight,
  blackRook,
  whitePawn,
  whiteBishop,
  whiteKing,
  whiteQueen,
  whiteKnight,
  whiteRook,
};
