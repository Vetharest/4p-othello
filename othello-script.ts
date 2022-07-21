import {
    Sprite,
    Application
} from "pixi.js";

const app = new Application(512, 512);
document.body.appendChild(app.view);


var blueSprite = PIXI.Texture.fromImage("./bluekris.png");
var redSprite = PIXI.Texture.fromImage("./redkris.png");
var greenSprite = PIXI.Texture.fromImage("./greenkris.png");
var yellowSprite = PIXI.Texture.fromImage("./yellowkris.png");
var emptyBox = PIXI.Texture.fromImage("./emptybox.png");
var legalBox = PIXI.Texture.fromImage("./legalbox.png");



let turnNumber = 0;

let initialize = (): Tile[][] => {
    let gameBoard: Tile[][] = [];
    for (let i = 0; i < 8; i++) {
        gameBoard[i] = [];
        for (let j = 0; j < 8; j++) {
            let box: Tile = new Tile(i, j, 5);
            box.sprite.interactive = true;
            box.sprite.buttonMode = true;
            box.sprite.on("pointerdown", box.move);
            box.setColor();
            gameBoard[i][j] = box;
        }
    }
    return gameBoard;
};


class Tile {
    value: number;
    sprite: Sprite;
    x: number;
    y: number;


    constructor(y: number, x: number, value: number) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.setColor();
    }

    setColor(): void { // sets color based on the value of the tile
        if (this.value === 0) {
            this.sprite = new PIXI.Sprite(blueSprite);
        } else if (this.value === 1) {
            this.sprite = new PIXI.Sprite(redSprite);
        } else if (this.value === 2) {
            this.sprite = new PIXI.Sprite(greenSprite);
        } else if (this.value === 3) {
            this.sprite = new PIXI.Sprite(yellowSprite);
        } else if (this.value === 7) {
            this.sprite = new PIXI.Sprite(legalBox);
        } else {
            this.sprite = new PIXI.Sprite(emptyBox);
        }
        this.sprite.scale.x = 0.246;
        this.sprite.x = 64 * this.x;
        this.sprite.scale.y = 0.248;
        this.sprite.y = 64 * this.y;
        app.stage.addChild(this.sprite);
    }

    move = (event?: Event): void => { // doesn't do anything if it's not a legal move
        if (this.value < 0 || this.value > 4) {
            let nextTurn = enforceRules(this);
            if (nextTurn) {
                turnNumber = (turnNumber + 1) % 4; // it is now the next player's turn
                let oneTurnPrediction = findLegals(turnNumber); // models the legal moves of the next player's turn
                let twoTurnPrediction = findLegals((turnNumber + 1) % 4);
                let threeTurnPrediction = findLegals((turnNumber + 2) % 4);
                let fourTurnPrediction = findLegals((turnNumber + 3) % 4);
                console.log("Next turn: " + oneTurnPrediction.length);
                console.log("Two turns: " + twoTurnPrediction.length);
                console.log("Three turn: " + threeTurnPrediction.length);
                console.log("Repetition turn: " + fourTurnPrediction.length);            
                if (oneTurnPrediction.length === 0) { // if the next player has no legal moves
                    if (twoTurnPrediction.length === 0) { // if the next two players have no legal moves
                        if (threeTurnPrediction.length === 0) { // if the next three players have no legal moves
                            if (fourTurnPrediction.length === 0) { // if no players have any legal moves
                                gameEnd();
                            } else { turnNumber = (turnNumber + 3) % 4; }
                        } else { turnNumber = (turnNumber + 2) % 4; } // if the next player has no legal moves, but the person after them does, skip one turn    
                    } else { turnNumber = (turnNumber + 1) % 4; }
                }
                refresh();
                let legals = findLegals(turnNumber);
                console.log(findLegals(0));
                for (let i = 0; i < legals.length; i++) {
                    legals[i].value = 7;
                    legals[i].setColor();
                }
            }
        }
    }

    place = (): void => {
        this.value = turnNumber;
        this.setColor();
    }
}

let board: Tile[][] = initialize();


let gameStart = (): void => { // creates initial setting with global variable board
    for (let i = 2; i < 6; i++) {
        for (let j = 2; j < 4; j++) {
            board[i][j].value = turnNumber;
            turnNumber = (turnNumber + 1) % 4;
            board[i][j].setColor();
        }
    }
    for (let i = 2; i < 6; i++) {
        for (let j = 4; j < 6; j++) {
            board[i][j].value = turnNumber;
            turnNumber = (turnNumber + 1) % 4;
            board[i][j].setColor();
        }
    }
    let legals = findLegals(0);
    for (let i = 0; i < legals.length; i++) {
        legals[i].value = 7;
        legals[i].setColor();
    }
};



let enforceRules = (tile: Tile): boolean => { // returns whether the move is legal, but also enforces the rules (duh)
    let legalMove = false;
    for (let row = tile.y - 1; row <= tile.y + 1; row++) {
        for (let col = tile.x - 1; col <= tile.x + 1; col++) {
            if (row >= 0 && row <= 7 && col >= 0 && col <= 7) { // blocking the edge of the board
                if (row !== tile.y || col !== tile.x) { // excluding mid case
                    if (board[row][col].value !== turnNumber) { // rule: pointless to put adjacent pieces
                        if (detect(turnNumber, row, col, row - tile.y, col - tile.x)) { // if a specific direction works
                            legalMove = true;
                            board[tile.y][tile.x].value = turnNumber;
                            board[tile.y][tile.x].place();
                            cleanRow(turnNumber, row, col, row - tile.y, col - tile.x);
                        }
                    }
                }
            }
        }
    }
    return legalMove;
};

let findLegals = (color: number): Tile[] => { // finds legal moves, color input refers to which turn it is
    let listOfLegals: Tile[] = [];
    for (let tRow = 0; tRow < 8; tRow++) { // t stands for tested
        for (let tColumn = 0; tColumn < 8; tColumn++) {
            if (board[tRow][tColumn].value > 4) {
                for (let row = board[tRow][tColumn].y - 1; row <= board[tRow][tColumn].y + 1; row++) {
                    for (let col = board[tRow][tColumn].x - 1; col <= board[tRow][tColumn].x + 1; col++) {
                        if (row >= 0 && row <= 7 && col >= 0 && col <= 7) { // blocking the edge of the board
                            if (row !== board[tRow][tColumn].y || col !== board[tRow][tColumn].x) { // excluding mid case
                                if (board[row][col].value !== color) { // rule: pointless to put adjacent pieces
                                    if (detect(color, row, col, row - board[tRow][tColumn].y, col - board[tRow][tColumn].x)) { // if a specific direction works
                                        listOfLegals[listOfLegals.length] = board[tRow][tColumn];
                                        col = board[tRow][tColumn].x + 1; // these two lines are in order to end
                                        row = board[tRow][tColumn].y + 1; // the inner for loops to avoid dupes
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return listOfLegals;
};



let refresh = (): void => {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board[i][j].value === 7) {
                board[i][j].value = 5;
                board[i][j].setColor();
            }
        }
    }
};

let detect = (color: number, tileY: number, tileX: number, ydir: number, xdir: number): boolean => {
    // turn = Which turn it is. Useful for modeling future turns. 
    // Y/X for initial values, y/x for direction
    if (tileX < 0 || tileX > 7 || tileY < 0 || tileY > 7) {
        return false;
    } else if (board[tileY][tileX].value > 4) {
        return false;
    } else if (board[tileY][tileX].value === color) {
        return true;
    } else {
        return detect(color, tileY + ydir, tileX + xdir, ydir, xdir);
    }
};

let cleanRow = (color: number, tileY: number, tileX: number, ydir: number, xdir: number): void => {
    // Only works if the detect function for the same parameters returns true
    if (board[tileY][tileX].value !== color) {
        board[tileY][tileX].place();
        cleanRow(color, tileY + ydir, tileX + xdir, ydir, xdir);
    }
};

let gameEnd = ():void => {
    let bluePoints = 0;
    let redPoints = 0;
    let greenPoints = 0;
    let yellowPoints = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board[i][j].value === 0) {
                bluePoints += 1;
            } else if (board[i][j].value === 1) {
                redPoints += 1;
            } else if (board[i][j].value === 2) {
                greenPoints += 1;
            } else if (board[i][j].value === 3) {
                yellowPoints += 1;
            }
        }
    }


    const graphics = new PIXI.Graphics();

    graphics.beginFill(0x000000);
    graphics.drawRect(126, 126, 260, 260);
    graphics.endFill();
    graphics.alpha = 0.65;

    const style = new PIXI.TextStyle({
        fontSize: 36,
        fontWeight: "bold",
        fill: "white"

    });

    const endText = new PIXI.Text("Game Over! \n", style);
    if (bluePoints > redPoints && bluePoints > greenPoints && bluePoints > yellowPoints) {
        endText.text += "Blue Wins with \n" + bluePoints + " points!\n";
        endText.text += "Red: " + redPoints;
        endText.text += "\nGreen: " + greenPoints;
        endText.text += "\nYellow: " + yellowPoints;
    } else if (redPoints > greenPoints && redPoints > yellowPoints) {
        endText.text += "Red Wins with \n" + redPoints + " points!\n";
        endText.text += "Blue: " + bluePoints;
        endText.text += "\nGreen: " + greenPoints;
        endText.text += "\nYellow: " + yellowPoints;
    } else if (greenPoints > yellowPoints) {
        endText.text += "Green Wins \nwith " + greenPoints + " points!\n";
        endText.text += "Blue: " + bluePoints;
        endText.text += "\nRed: " + redPoints;
        endText.text += "\nYellow: " + yellowPoints;
    } else {
        endText.text += "Yellow Wins \nwith " + yellowPoints + " points!\n";
        endText.text += "Blue: " + bluePoints;
        endText.text += "\nRed: " + redPoints;
        endText.text += "\nGreen: " + greenPoints;
    }
    endText.x = 130;
    endText.y = 130;

    app.stage.addChild(graphics);
    app.stage.addChild(endText);
};

gameStart();