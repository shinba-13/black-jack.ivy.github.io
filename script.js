// --- DOM要素の取得 ---
const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');
const dealerScoreEl = document.getElementById('dealer-score');
const playerScoreEl = document.getElementById('player-score');
const messageEl = document.getElementById('message');
const dealBtn = document.getElementById('deal-btn');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');

// --- 新しいDOM要素の取得（賭け金関連） ---
const balanceEl = document.getElementById('balance');
const currentBetEl = document.getElementById('current-bet');
const betAmountInput = document.getElementById('bet-amount');
const placeBetBtn = document.getElementById('place-bet-btn');

// --- グローバル変数 ---
let deck = [];
let dealerHand = [];
let playerHand = [];
let balance = 1000; // 初期残高
let currentBet = 0; // 現在の賭け金
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♣', '♥', '♦']; // スペード、クラブ、ハート、ダイヤ

// --- 関数定義 ---

/**
 * デッキ（山札）を作成する
 */
function createDeck() {
    deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            let value;
            // カードの点数を決定
            if (['J', 'Q', 'K'].includes(rank)) {
                value = 10;
            } else if (rank === 'A') {
                value = 11; // エースは最初は11として計算
            } else {
                value = parseInt(rank);
            }
            deck.push({ rank, suit, value });
        }
    }
}

/**
 * デッキをシャッフルする（フィッシャー・イェーツ・アルゴリズム）
 */
function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]; // 要素の入れ替え
    }
}

/**
 * デッキからカードを1枚引く
 */
function drawCard() {
    if (deck.length > 0) {
        return deck.pop(); // 配列の末尾からカードを取り出す
    }
    return null;
}

/**
 * 手札の合計点数を計算する
 * @param {Array} hand - 計算対象の手札
 * @returns {number} - 合計点数
 */
function calculateScore(hand) {
    let score = 0;
    let aceCount = 0;

    for (const card of hand) {
        score += card.value;
        if (card.rank === 'A') {
            aceCount++;
        }
    }

    // エースを11から1に調整する処理（バスト回避）
    while (score > 21 && aceCount > 0) {
        score -= 10; // 11を1に変更（11-1=10を下げる）
        aceCount--;
    }

    return score;
}

/**
 * カードをHTMLで表示する要素を作成する（絵柄表示対応）
 * @param {Object} card - 表示するカードオブジェクト
 * @param {boolean} isHidden - カードを裏返すかどうか
 */
function createCardElement(card, isHidden = false) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    
    if (isHidden) {
        cardDiv.classList.add('hidden');
        cardDiv.textContent = ''; // 裏面はテキストなし
        return cardDiv;
    } 

    // ハートとダイヤは赤色クラスを追加
    if (card.suit === '♥' || card.suit === '♦') {
        cardDiv.classList.add('red');
    }

    // カードのランクとスートを要素内に配置
    cardDiv.innerHTML = `
        <span class="rank top">${card.rank}</span>
        <span class="suit center">${card.suit}</span>
        <span class="rank bottom">${card.rank}</span>
    `;
    
    return cardDiv;
}

/**
 * 残高表示を更新する
 */
function updateBalanceDisplay() {
    balanceEl.textContent = balance;
    currentBetEl.textContent = currentBet;
    
    // 残高が0以下になったら、賭け金ボタンも無効にする
    if (balance <= 0) {
        betAmountInput.disabled = true;
        placeBetBtn.disabled = true;
    } else {
        betAmountInput.disabled = false;
    }
}

/**
 * 画面上の手札とスコアを更新する
 * @param {boolean} revealDealer - ディーラーの裏向きカードを表にするか
 */
function updateDisplay(revealDealer = false) {
    // プレイヤーの手札
    playerCardsEl.innerHTML = '';
    for (const card of playerHand) {
        playerCardsEl.appendChild(createCardElement(card));
    }
    playerScoreEl.textContent = calculateScore(playerHand);

    // ディーラーの手札
    dealerCardsEl.innerHTML = '';
    
    // ディーラーの手札表示ロジック
    for (let i = 0; i < dealerHand.length; i++) {
        const card = dealerHand[i];
        // revealDealerがtrueでない限り、2枚目（インデックス1）は裏面
        const isHidden = !revealDealer && i === 1;
        dealerCardsEl.appendChild(createCardElement(card, isHidden));
    }
    
    // ディーラーのスコア表示
    if (revealDealer) {
        dealerScoreEl.textContent = calculateScore(dealerHand);
    } else if (dealerHand.length > 0) {
        // 裏向きカードがある場合、最初のカードの点数のみ表示
        dealerScoreEl.textContent = dealerHand[0].value + ' + ?';
    } else {
        dealerScoreEl.textContent = '0';
    }
    
    updateBalanceDisplay(); // 残高も更新
}

/**
 * ゲームのボタンの状態を制御する
 * @param {boolean} canDeal - Dealボタンを有効にするか
 * @param {boolean} canHitStand - Hit/Standボタンを有効にするか
 */
function toggleControls(canDeal, canHitStand) {
    dealBtn.disabled = !canDeal;
    hitBtn.disabled = !canHitStand;
    standBtn.disabled = !canHitStand;

    // 賭け金関連のボタン制御
    // Dealが有効な時のみ、Betも有効
    placeBetBtn.disabled = !canDeal || balance <= 0;
    betAmountInput.disabled = !canDeal || balance <= 0;
}

/**
 * 勝敗を判定し、残高を更新し、ゲームを終了する
 */
function checkWinner() {
    toggleControls(true, false); // ゲーム終了後のコントロール設定
    updateDisplay(true); // ディーラーのカードを表にする
    
    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(dealerHand);
    let winMultiplier = 0; // 勝利倍率 (0:負け, 1:プッシュ, 2:勝ち, 2.5:BJ)

    // --- 勝敗判定 ---
    if (pScore > 21) {
        messageEl.textContent = `バスト！(${pScore}) ディーラーの勝利！`;
        winMultiplier = 0; // 負け
    } else if (dScore > 21) {
        messageEl.textContent = `ディーラーバスト！(${dScore}) あなたの勝利！`;
        winMultiplier = 2; // 勝ち (賭け金 + 利益)
    } else if (pScore === 21 && playerHand.length === 2) {
        // ブラックジャック（通常1.5倍の利益、ここでは簡略化のため2.5倍にしておく）
        messageEl.textContent = '✨ブラックジャック！あなたの勝利！✨';
        winMultiplier = 2.5; 
    } else if (pScore > dScore) {
        messageEl.textContent = `あなたの勝利！ (${pScore} 対 ${dScore})`;
        winMultiplier = 2;
    } else if (dScore > pScore) {
        messageEl.textContent = `ディーラーの勝利！ (${pScore} 対 ${dScore})`;
        winMultiplier = 0;
    } else {
        messageEl.textContent = `プッシュ (引き分け)！ (${pScore} 対 ${dScore})`;
        winMultiplier = 1; // 賭け金が戻ってくる
    }
    
    // --- 残高の更新 ---
    balance += currentBet * winMultiplier;
    currentBet = 0; // 賭け金をリセット
    updateBalanceDisplay();

    // 破産チェック
    if (balance <= 0) {
        messageEl.textContent += " 残高がなくなりました！ゲームオーバー。";
        toggleControls(false, false); // 全ての操作を停止
    }
}

// --- イベントリスナー（ボタンが押された時の動作） ---

// Betボタン (賭け金確定)
placeBetBtn.addEventListener('click', () => {
    const amount = parseInt(betAmountInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        messageEl.textContent = '有効な賭け金を入力してください。';
        return;
    }

    if (amount > balance) {
        messageEl.textContent = `残高($${balance})が不足しています。`;
        return;
    }
    
    // 既存の賭け金があれば、残高に戻す（これは省略）

    // 賭け金を確定し、残高から引く
    currentBet = amount;
    balance -= currentBet;
    
    updateBalanceDisplay();
    messageEl.textContent = `${currentBet}$ を賭けました。Dealを押してください。`;
    
    // 賭け金確定後はDealのみ可能、Betは無効
    dealBtn.disabled = false;
    placeBetBtn.disabled = true;
    betAmountInput.disabled = true;
    hitBtn.disabled = true;
    standBtn.disabled = true;
});


// Dealボタン (ゲーム開始)
dealBtn.addEventListener('click', () => {
    if (currentBet === 0) {
        messageEl.textContent = '最初に賭け金を確定してください。';
        return; // 賭け金がなければゲームを始めない
    }

    // リセット
    messageEl.textContent = 'ゲーム中...';
    playerHand = [];
    dealerHand = [];
    
    // デッキ作成＆シャッフル
    createDeck();
    shuffleDeck();

    // 最初のカード配布
    playerHand.push(drawCard());
    dealerHand.push(drawCard());
    playerHand.push(drawCard());
    dealerHand.push(drawCard()); // ディーラーの2枚目は裏表示

    updateDisplay();
    
    // コントロールの更新
    toggleControls(false, true); // Hit/Standを有効

    // 最初にブラックジャックかチェック
    if (calculateScore(playerHand) === 21) {
        // ブラックジャックの場合、すぐに勝敗判定へ
        standBtn.click();
    }
});

// Hitボタン (カード追加)
hitBtn.addEventListener('click', () => {
    const newCard = drawCard();
    if (newCard) {
        playerHand.push(newCard);
        updateDisplay();
        
        // バストチェック
        if (calculateScore(playerHand) > 21) {
            checkWinner();
        }
    }
});

// Standボタン (勝負)
standBtn.addEventListener('click', () => {
    // プレイヤーの操作を無効化
    toggleControls(false, false);
    messageEl.textContent = 'ディーラーのターン...';
    
    // ディーラーの処理（17点以上になるまでHit）
    const dealerPlay = setInterval(() => {
        let dScore = calculateScore(dealerHand);
        
        if (dScore < 17) {
            // 17点未満ならHit
            const newCard = drawCard();
            if (newCard) {
                dealerHand.push(newCard);
                updateDisplay(true); // ディーラーのカードを表にする
            }
        } else {
            // 17点以上になったら終了
            clearInterval(dealerPlay);
            checkWinner(); // 勝敗判定
        }
    }, 1000); // 1秒ごとにカードを引く
});

// 初期状態の表示
updateDisplay();
dealerScoreEl.textContent = '0'; // 初期スコアをリセット
updateBalanceDisplay(); // 残高表示を初期化