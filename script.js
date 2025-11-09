// Player factory
const Player = (name, marker) => ({ name, marker });

// Gameboard module (single instance)
const Gameboard = (() => {
	let board = Array(9).fill("");

	const setMarker = (index, marker) => {
		if (index < 0 || index > 8) return false;
		if (board[index]) return false; // spot taken
		board[index] = marker;
		return true;
	};

	const getBoard = () => board.slice();

	const reset = () => {
		board = Array(9).fill("");
	};

	return { setMarker, getBoard, reset };
})();

// Game controller module (single instance)
const GameController = (() => {
	const winningCombos = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8],
		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8],
		[0, 4, 8],
		[2, 4, 6],
	];

	let players = [];
	let current = 0;
	let ongoing = false;

	const start = (p1Name, p2Name) => {
		players = [Player(p1Name || "Player 1", "X"), Player(p2Name || "Player 2", "O")];
		current = 0;
		ongoing = true;
		Gameboard.reset();
		console.log("Game started", players.map(p => p.name));
		return players;
	};

	const checkWin = (board, marker) => {
		return winningCombos.some(combo => combo.every(i => board[i] === marker));
	};

	const playRound = (index) => {
		if (!ongoing) return false;
		const player = players[current];
		const ok = Gameboard.setMarker(index, player.marker);
		if (!ok) return false; // invalid move

		const board = Gameboard.getBoard();
		if (checkWin(board, player.marker)) {
			ongoing = false;
			console.log(`${player.name} wins!`);
			return { winner: player };
		}

		if (board.every(cell => cell)) {
			ongoing = false;
			console.log("Tie game");
			return { tie: true };
		}

		current = 1 - current;
		return { next: players[current] };
	};

	const getCurrentPlayer = () => players[current];
	const isOngoing = () => ongoing;
	const restart = () => {
		players = [];
		current = 0;
		ongoing = false;
		Gameboard.reset();
	};

	return { start, playRound, getCurrentPlayer, isOngoing, restart };
})();

// Display / DOM controller (single instance)
const DisplayController = (() => {
	const boardEl = document.getElementById("board");
	const cells = Array.from(document.querySelectorAll(".cell"));
	const startBtn = document.getElementById("startBtn");
	const restartBtn = document.getElementById("restartBtn");
	const p1Input = document.getElementById("player1");
	const p2Input = document.getElementById("player2");
	const messageEl = document.getElementById("message");

	const renderBoard = () => {
		const board = Gameboard.getBoard();
		cells.forEach((cell, i) => {
			cell.textContent = board[i] || "";
			cell.classList.toggle("taken", !!board[i]);
		});
	};

	const setMessage = (msg) => {
		messageEl.textContent = msg;
	};

	function handleCellClick(e) {
		const index = Number(e.currentTarget.dataset.index);
		const result = GameController.playRound(index);
		if (result === false) {
			setMessage("Invalid move — spot taken or game not started.");
			return;
		}

		renderBoard();

		if (result.winner) {
			setMessage(`${result.winner.name} wins!`);
		} else if (result.tie) {
			setMessage("It's a tie!");
		} else if (result.next) {
			setMessage(`${result.next.name}'s turn (${result.next.marker})`);
		}
	}

	// Attach cell listeners
	cells.forEach(cell => {
		cell.addEventListener("click", handleCellClick);
		cell.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") handleCellClick(e);
		});
	});

	// Start / Restart
	startBtn.addEventListener("click", () => {
		const p1 = p1Input.value.trim() || "Player 1";
		const p2 = p2Input.value.trim() || "Player 2";
		GameController.start(p1, p2);
		renderBoard();
		const curr = GameController.getCurrentPlayer();
		setMessage(`${curr.name}'s turn (${curr.marker})`);
	});

	restartBtn.addEventListener("click", () => {
		GameController.restart();
		Gameboard.reset();
		renderBoard();
		setMessage("Enter names and start the game.");
	});

	// Initial render
	renderBoard();

	return { renderBoard, setMessage };
})();

// Expose small debug hooks for console-first testing (minimal globals)
window._Gameboard = Gameboard;
window._GameController = GameController;
window._DisplayController = DisplayController;

// Quick guidance printed to console for testing
console.log("Tic-Tac-Toe ready. Use _GameController.start('A','B') then _GameController.playRound(index) or interact with the page.");
