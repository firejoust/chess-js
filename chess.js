const prompt = require('prompt-sync')();

const horizontal_order = ["A", "B", "C", "D", "E", "F", "G", "H"];
const vertical_order = ["1", "2", "3", "4", "5", "6", "7", "8"];

function type(id, infinite, cost, moves, firstmoves, takemoves) {
    this.id = id;
    this.infinite = infinite;
    this.cost = cost;
    this.moves = moves;
    this.firstmoves = firstmoves;
    this.takemoves = takemoves;
}

const pieces = {
    "pawn": () => { return new type("pawn", false, 1, [[0, 1]], [[0, 2]], [[-1, 1], [1, 1]]) },
    "knight": () => { return new type("knight", false, 2, [[-1, 2], [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1]], [], []) },
    "bishop": () => { return new type("bishop", true, 3, [[1, 1], [1, -1], [-1, -1], [-1, 1]], [], []) },
    "rook": () => { return new type("rook", true, 4, [[0, 1], [1, 0], [0, -1], [-1, 0]], [], []) },
    "queen": () => { return new type("queen", true, 5, [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]], [], []) },
    "king": () => { return new type("king", false, 6, [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]], [], []) },
};

/*
// Board, piece & interface setup. Misc. included
*/

function isWhite(colour) {
    //return colour === "white"; // Removed to be safe. case-if is a better way of handling this
    switch (colour) {
        case "white":
            return true;
        case "black":
            return false;
        default:
            throw (`Invalid colour specified "${colour}."`);
    }
}

// Generates a chess piece
function generatePiece(type, colour, vec2) {

    // Reverse pawn direction for black
    if (type.id === "pawn" && !isWhite(colour)) {
        type.moves[0] = [0, -1];
        type.firstmoves = [
            [0, -2]
        ];
        type.takemoves = [
            [1, -1],
            [-1, -1]
        ];
    }

    return {
        "type": type,
        "colour": colour,
        "location": vec2,
        "moved": false,
    };
};

// Returns an empty board configuration
function generateBoard() {
    let board = [];

    // Every horizontal row of the board, create a new array.

    for (let y = 0, max_y = 8; y < max_y; y++) {
        board.push([]);

        // Create squares for each position on the board
        for (let x = 0, max_x = 8; x < max_x; x++) {
            let object = {};
            object.square = horizontal_order[x] + vertical_order[y];
            object.location = [x, y];
            object.occupation = null;
            object.checked = false;
            board[y].push(object);
        }
    }
    return board;
}

// Returns a normal chess configuration
function generateFormation(colour) {
    let formation = [];
    let primary_row, pawn_row; // Which row the pieces are generated in

    if (isWhite(colour)) {
        primary_row = 0;
        pawn_row = 1;
    }

    else {
        primary_row = 7;
        pawn_row = 6;
    }

    // Generate the first row of pieces
    formation.push(generatePiece(pieces.rook(), colour, [0, primary_row]));
    formation.push(generatePiece(pieces.knight(), colour, [1, primary_row]));
    formation.push(generatePiece(pieces.bishop(), colour, [2, primary_row]));
    formation.push(generatePiece(pieces.king(), colour, [3, primary_row]));
    formation.push(generatePiece(pieces.queen(), colour, [4, primary_row]));
    formation.push(generatePiece(pieces.bishop(), colour, [5, primary_row]));
    formation.push(generatePiece(pieces.knight(), colour, [6, primary_row]));
    formation.push(generatePiece(pieces.rook(), colour, [7, primary_row]));

    // Generate a row of pawns
    for (let x = 0, max_x = 8; x < max_x; x++) {
        let piece = generatePiece(pieces.pawn(), colour, [x, pawn_row]);
        formation.push(piece)
    }
    return formation;
}

function displayBoard(board, colour, move_sequence) {
    move_sequence = move_sequence || [];
    let display_board = [];
    let display = "";
    let display_pawn = ["♙", "♟︎"];
    let display_knight = ["♘", "♞"];
    let display_bishop = ["♗", "♝"];
    let display_rook = ["♖", "♜"];
    let display_queen = ["♕", "♛"];
    let display_king = ["♔", "♚"];

    // Returns true if square vector is equal to move vector
    function moveSquare(arr, search_value) {
        for (let i = 0, il = arr.length; i < il; i++) {

            // Match found
            if (arr[i][0] === search_value[0] && arr[i][1] === search_value[1]) {
                return true;
            }
        }
        return false;
    }

    // Run for each board row
    for (let row_number = 0, maximum_rows = board.length; row_number < maximum_rows; row_number++) {
        let display_row = [];
        let row = board[row_number];

        // Display numbers on the side of board
        display_row.push(`${"\x1b[31m"}${vertical_order[row_number]}${"\x1b[0m"} `);

        // Run for each square in row
        for (let square_number = 0, maximum_squares = row.length; square_number < maximum_squares; square_number++) {
            let prefix = "\x1b[0m", suffix = "\x1b[0m";
            let display_square = " ";
            let square = row[square_number];

            // Move location
            if (moveSquare(move_sequence, square.location)) {
                prefix = '\x1b[32m';
                display_square = 'x';
            }

            // Empty square
            if (square.occupation !== null) {
                let piece = square.occupation;
                let type = piece.type;

                // Change the display for each piece
                switch (type.id) {
                    case "pawn":
                        display_square = display_pawn[isWhite(piece.colour) + 0]; // plus 0 to convert to an integer
                        break;
                    case "knight":
                        display_square = display_knight[isWhite(piece.colour) + 0];
                        break;
                    case "bishop":
                        display_square = display_bishop[isWhite(piece.colour) + 0];
                        break;
                    case "rook":
                        display_square = display_rook[isWhite(piece.colour) + 0];
                        break;
                    case "queen":
                        display_square = display_queen[isWhite(piece.colour) + 0];
                        break;
                    case "king":
                        display_square = display_king[isWhite(piece.colour) + 0];
                        break;
                }
            }

            display_row.push(`${prefix}[${display_square}]${suffix} `);
        }
        display_board.push(display_row);
    }

    /*
    // For black perspective: Row loop ascending (++), square loop descending (--).
    // For white perspective: Row loop descending (--), square loop ascending (++).
    */

    // Every row
    function whitePerspective() {
        for (let row_number = display_board.length - 1, maximum_rows = 0; row_number >= maximum_rows; row_number--) {
            let display_row = display_board[row_number];

            // Every square
            for (let square_number = 0, maximum_squares = display_row.length; square_number < maximum_squares; square_number++) {
                let display_square = display_row[square_number];
                display = display + display_square;
            }
            display = display + "\n\n";
        }
    }

    function blackPerspective() {
        for (let row_number = 0, maximum_rows = display_board.length; row_number < maximum_rows; row_number++) {
            let display_row = display_board[row_number];

            // Every square
            for (let square_number = display_row.length - 1, maximum_squares = 0; square_number >= maximum_squares; square_number--) {
                let display_square = display_row[square_number];
                display = display + display_square;
            }
            display = display + "\n\n";
        }
    }

    switch (colour) {
        case "white":
            whitePerspective();
            break;

        case "black":
            blackPerspective();
            break;

        default:
            throw (`Invalid colour specified "${colour}".`);
    }
    return display;
}

// Gets a square from an x and y value
function getSquare(board, vec2) {
    let x = vec2[0], y = vec2[1];
    let row = board[y];
    let square = row[x];
    return square;
}

// one + two. Returns the new vector or null if it's too far out of range.
function addVector(board, vec2_one, vec2_two) {
    let y_maximum = board.length - 1; // Minus one. Vectors start at 0.
    let x_maximum = board[0].length - 1;

    let x_offset = vec2_one[0] + vec2_two[0];
    let y_offset = vec2_one[1] + vec2_two[1];

    // Out of range. Cannot make a move outside the board.
    if (x_offset > x_maximum || x_offset < 0 || y_offset > y_maximum || y_offset < 0) {
        return null;
    }

    // Valid position
    else {
        return [x_offset, y_offset];
    }
}

// Updates the board with new positions of the pieces, returns the new board
function updateBoard(board, piece_array) {

    // For each piece in the array
    for (let i = 0, il = piece_array.length; i < il; i++) {
        let piece = piece_array[i];
        let x = piece.location[0]; // Look for the x location
        let y = piece.location[1]; // Look for the y location
        let row = board[y]; // Board at index y
        let square = row[x]; // Row at index x
        square.occupation = piece;

        row[x] = square; // Update the square
        board[y] = row; // Update the row
    }
    return board;
}

function getLocationBySquare(square) {
    if (square.length === 2) {
        let letter = square[0].toString();
        let number = square[1].toString();

        if (horizontal_order.includes(letter) && vertical_order.includes(number)) {
            let x = horizontal_order.indexOf(letter);
            let y = vertical_order.indexOf(number);
            return [x, y];
        }
    }
    return null;
}

// Removes a piece from a piece array and returns the updated array
function removePiece(piece_array, piece) {
    let updated_piece_array = [];

    // Each piece
    for (let i = 0, il = piece_array.length; i < il; i++) {
        let iterated_piece = piece_array[i];

        // Add everything but the removed piece
        if (iterated_piece !== piece) {
            updated_piece_array.push(piece);
        }
    };
    return updated_piece_array;
}

// Return a list of valid vec2 moves relative to a piece's location.
// ToDo: 
// - Infinite pieces integration
// - Castling
// - Check
function getValidMoves(board, piece) {
    let moves = piece.type.moves;
    let valid_moves = [];

    // First move of a piece
    if (!piece.moved) {
        moves = moves.concat(piece.type.firstmoves);
    }

    // Pawns have moves they can only execute upon taking a piece
    if (piece.type.id === "pawn") {
        moves = moves.concat(piece.type.takemoves);
    }

    // Check all possible moves
    for (let i = 0, il = moves.length; i < il; i++) {
        let valid = true;
        let location = piece.location;
        let move_location = addVector(board, location, moves[i]);

        // Move is outside the board, invalid
        if (move_location === null) {
            valid = false;
        }

        // Move is inside the board
        else if (move_location !== null) {
            let square = getSquare(board, move_location);

            // King can't move to spaces that would put it in check.
            if (piece.type.id === "king" && square.checked) {
                valid = false;
            }

            // The square is occupied.
            if (square.occupation !== null) {
                let occupied_piece = square.occupation;

                // Occupied by own colour piece, cannot move.
                if (occupied_piece.colour === piece.colour) {
                    valid = false;
                }

                // Can't take the king.
                else if (occupied_piece.type.id === "king") {
                    valid = false;
                }

                // Pawn special conditions
                else if (piece.type.id === "pawn") {

                    // Pawns can't take a piece without moving diagonally.
                    if (!piece.type.takemoves.includes(moves[i])) {
                        valid = false;
                    }
                }
            }

            // Empty square
            else if (square.occupation === null) {

                // Pawn special conditions
                if (piece.type.id === "pawn") {

                    // Pawns cannot move diagonal without a piece to take
                    if (piece.type.takemoves.includes(moves[i])) {
                        valid = false;
                    }
                }
            }

            // Move is valid, add the updated location
            if (valid) {
                valid_moves.push(move_location);
            }
        }
    }
    return valid_moves;
}

function generateGame(id, board, white, black, turn) {
    this.id = id;
    this.board = board;
    this.white = white;
    this.black = black;
    this.turn = turn; // True is white, false is black.
    this.active = true;
};

// Displays a prompt, and runs a callback function after input is given. Returns the value of that function.
function cbprompt(question, callback) {
    let value = prompt(question);
    return callback(value);
}

function getPieceByLocation(piece_array, vec2) {
    for (let i = 0, il = piece_array.length; i < il; i++) {
        let piece = piece_array[i];

        // Match found
        if (piece.location[0] === vec2[0] && piece.location[1] === vec2[1]) {
            return piece;
        }
    }
    return null;
}

function getValidPieces(board, piece_array) {
    let return_piece_array = [];
    for (let i = 0, il = piece_array.length; i < il; i++) {
        let piece = piece_array[i];
        let moves = getValidMoves(board, piece);

        // Possible moves
        if (moves.length > 0) {
            return_piece_array.push(piece);
        }
    }
    return return_piece_array;
}

// Prompts the player to choose a valid piece on the board to move.
function displayPieces(board, piece_array) {
    let piece_display = "";

    // Get colour pieces on board | make it get allowed moves
    for (let i = 0, il = piece_array.length; i < il; i++) {
        let piece = piece_array[i];
        piece_display += `[${piece.type.id} at ${getSquare(board, piece.location).square}]${(i + 1) === il ? '.' : ','} `;
    }
    return piece_display;
}

function displayMoves(board, moves) {
    let move_display = "";

    for (let i = 0, il = moves.length; i < il; i++) {
        let move = moves[i];
        let square = getSquare(board, move);
        let prefix = square.occupation === null ? "" : `Take ${square.occupation.type.id} at `;
        move_display += `[${prefix}${square.square}]${i+1 === il ? "." : ","} `;
    }
    return move_display;
}

function startGame(game) {
    let board = game.board;
    console.log(`\nStarting game '${game.id}'.`);
    console.log(`${game.turn ? "white" : "black"} will move first.\n`);

    function choosePiece(colour) {
        let piece_array, piece_display, return_piece = null;

        // Display possible moves for a specific colour
        switch (colour) {
            case "white":
                piece_array = game.white;
                break;

            case "black":
                piece_array = game.black;
                break;

            default:
                throw ("No colour defined.");
        }
        piece_array = getValidPieces(board, piece_array);
        piece_display = displayPieces(board, piece_array);
        console.log(displayBoard(board, colour));
        console.log(`Select a piece by typing its square. (Example: A2)\nMoveable pieces: ${piece_display}`);

        // Prompt again if invalid selection given
        while (return_piece === null) {
            let selection = cbprompt("> ", getLocationBySquare);

            // Valid selection given
            if (selection !== null) {
                let piece = getPieceByLocation(piece_array, selection);

                // Match found
                if (piece !== null) {
                    return_piece = piece;
                    break;
                } else console.log("\nInvalid piece selected.\n"); // Invalid piece (null)
            } else console.log("\nInvalid square selected.\n"); // Invalid square (null)
        }
        return return_piece;
    }

    function chooseMove(piece) {
        let return_move = null;
        let moves = getValidMoves(board, piece);
        console.log(displayBoard(board, colour, moves));
        console.log(`\nYou selected your ${piece.type.id}. No taking it back.\nMove by typing the square to move to. (Example: A1)\n\nPossible moves: ${displayMoves(board, moves)}`);

        // Prompt again if invalid selection given
        while (return_move === null) {
            let selection = cbprompt("> ", getLocationBySquare);

            // Valid selection given
            if (selection !== null) {
                return_move = selection;
                /*
                let square = getSquare(board, selection);

                if (square.occupation !== null) {
                    removePiece(black, square.occupation);
                }
                */

            } else console.log("Invalid square selected.");

        }
        return return_move;
    }

    function movePiece(piece, move) {
        let current_square = getSquare(board, piece.location);
        let move_square = getSquare(board, move);

        // Taking a piece
        if (move_square.occupation !== null) {

            // White's turn, remove the black piece.
            if (game.turn) {
                black = removePiece(black, move_square.occupation);
            }

            // Black's turn, remove a white piece.
            else if (!game.turn) {
                white = removePiece(white, move_square.occupation);
            }

            else throw("Strange error occured..."); // This error is very hard to get
        }

        // It is no longer the first move
        if (!piece.moved) {
            piece.moved = true;
        }

        current_square.occupation = null; // Clear previous square
        piece.location = move;
    }

    while (game.active) {
        colour = game.turn ? "white" : "black";
        let piece = choosePiece(colour); // Prompt the user to enter a piece.
        let move = chooseMove(piece); // Prompt the user to choose a move.
        movePiece(piece, move); // Update the piece's new position.
        updateBoard(board, white); // Update white pieces
        updateBoard(board, black); // Update black pieces
        game.turn = !game.turn; // Change turns.
    }
}

var board = generateBoard();
var white = generateFormation("white");
var black = generateFormation('black');
board = updateBoard(board, white);
board = updateBoard(board, black);
let game = new generateGame("main", board, white, black, true);
let lucky_piece = white[9];
startGame(game);
