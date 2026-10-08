// 손 회피(멀티 방향) 로직 담당
const BattleManager = {
    inBattle: false,
    currentProduct: null,
    battleTimeout: null,
    requiredDodges: 5,
    dodgeCount: 0,
    attackDirections: [],
    onResolve: null,

    overlayEl: null,
    battleMsgEl: null,
    instructionEl: null,
    battleGridEl: null,
    playerUnitEl: null,
    playerHandEl: null,
    playerProductEl: null,
    directionEls: {},

    init() {
        this.overlayEl = document.getElementById('battle-overlay');
        this.battleMsgEl = document.getElementById('battle-msg');
        this.instructionEl = document.getElementById('instruction');
        this.battleGridEl = document.getElementById('battle-grid');
        this.playerUnitEl = document.getElementById('player-unit');
        this.playerHandEl = document.getElementById('player-hand');
        this.playerProductEl = document.getElementById('player-product');
        this.directionEls = {
            up: document.querySelector('[data-dir="up"]'),
            left: document.querySelector('[data-dir="left"]'),
            right: document.querySelector('[data-dir="right"]'),
            down: document.querySelector('[data-dir="down"]')
        };

        document.querySelectorAll('.battle-direction, .rival-hand, #player-hand, #battle-grid').forEach(el => {
            el.style.overflow = 'visible';
        });
        document.querySelectorAll('.rival-hand img, #player-hand img').forEach(img => {
            img.style.maxWidth = 'none';
            img.style.maxHeight = 'none';
            img.style.width = '170px';
            img.style.height = '170px';
        });

        this.setPlayerHandArt();
        window.addEventListener('keydown', (e) => this.handleKeyPress(e));
    },

    createHandSvg(isPlayer) {
        const asset = isPlayer ? 'assets/hand-player.svg' : 'assets/hand-attack.svg';
        return `<img src="${asset}" alt="${isPlayer ? '플레이어 손' : '상대 손'}" draggable="false">`;
    },

    setPlayerHandArt(label = '중앙') {
        if (!this.playerHandEl) return;
        this.playerHandEl.innerHTML = this.createHandSvg(true);
        if (this.playerProductEl) {
            this.playerProductEl.textContent = label;
        }
    },

    start(itemName, isSale, element, onResolve) {
        if (this.inBattle) return;

        this.inBattle = true;
        this.currentProduct = { name: itemName, sale: isSale, element };
        this.onResolve = onResolve;
        this.requiredDodges = 5;
        this.dodgeCount = 0;
        this.attackDirections = [];
        this.setPlayerHandArt(itemName);
        if (this.playerUnitEl) this.playerUnitEl.className = '';

        this.overlayEl.classList.add('active');
        this.battleMsgEl.textContent = '손이 쏟아진다!';
        this.instructionEl.textContent = `${itemName}을(를) 지키세요! 안전한 방향으로 피하세요!`;
        this.clearDirections();
        this.showWave();
    },

    clearDirections() {
        Object.values(this.directionEls).forEach(el => {
            if (!el) return;
            el.innerHTML = '';
            el.classList.remove('danger');
        });
        if (this.battleGridEl) {
            this.battleGridEl.querySelectorAll('.rival-hand').forEach(hand => hand.remove());
        }
    },

    showWave() {
        if (!this.inBattle) return;

        const allDirections = ['up', 'down', 'left', 'right'];
        const directionCount = this.currentProduct && this.currentProduct.sale ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);
        const attackDirections = [];

        while (attackDirections.length < directionCount) {
            const dir = allDirections[Math.floor(Math.random() * allDirections.length)];
            if (!attackDirections.includes(dir)) {
                attackDirections.push(dir);
            }
        }

        this.clearDirections();
        this.attackDirections = attackDirections;

        const gridRect = this.battleGridEl.getBoundingClientRect();
        const playerRect = this.playerUnitEl.getBoundingClientRect();
        const handOffsets = {
            up: { x: 0, y: -190 },
            down: { x: 0, y: 190 },
            left: { x: -220, y: 0 },
            right: { x: 220, y: 0 }
        };
        const playerCenterX = playerRect.left + playerRect.width / 2 - gridRect.left;
        const playerCenterY = playerRect.top + playerRect.height / 2 - gridRect.top;

        attackDirections.forEach(dir => {
            const hand = document.createElement('div');
            hand.className = 'rival-hand';
            hand.dataset.dir = dir;
            hand.innerHTML = this.createHandSvg(false);
            const offset = handOffsets[dir];
            hand.style.left = `${playerCenterX - 36}px`;
            hand.style.top = `${playerCenterY - 40}px`;
            hand.style.setProperty('--start-x', `${offset.x}px`);
            hand.style.setProperty('--start-y', `${offset.y}px`);
            hand.style.setProperty('--move-x', `${offset.x * 0.7}px`);
            hand.style.setProperty('--move-y', `${offset.y * 0.7}px`);
            this.battleGridEl.appendChild(hand);
        });

        const safeDirections = allDirections.filter(dir => !attackDirections.includes(dir));
        this.battleMsgEl.textContent = `회피 ${this.dodgeCount + 1}/${this.requiredDodges}`;
        this.instructionEl.textContent = `손이 ${attackDirections.map(dir => this.labelForDirection(dir)).join(', ')} 방향에서 들어옵니다! 안전한 방향으로 피하세요: ${safeDirections.map(dir => this.labelForDirection(dir)).join(', ')}`;

        clearTimeout(this.battleTimeout);
        const responseTime = this.currentProduct && this.currentProduct.sale ? 650 : 900;
        this.battleTimeout = setTimeout(() => {
            this.resolve(false);
        }, responseTime);
    },

    labelForDirection(dir) {
        const labels = { up: '위', down: '아래', left: '왼쪽', right: '오른쪽' };
        return labels[dir] || dir;
    },

    directionFromKey(key) {
        if (key === 'ArrowUp') return 'up';
        if (key === 'ArrowDown') return 'down';
        if (key === 'ArrowLeft') return 'left';
        if (key === 'ArrowRight') return 'right';
        return null;
    },

    handleKeyPress(e) {
        if (!this.inBattle || this.attackDirections.length === 0) return;

        const pressedDirection = this.directionFromKey(e.key);
        if (!pressedDirection) return;

        e.preventDefault();
        clearTimeout(this.battleTimeout);

        const isSafe = !this.attackDirections.includes(pressedDirection);

        if (isSafe) {
            this.dodgeCount += 1;
            this.setPlayerHandArt(this.currentProduct ? this.currentProduct.name : '중앙');
            if (this.playerUnitEl) this.playerUnitEl.className = pressedDirection;
            this.battleMsgEl.textContent = `회피 성공! ${this.dodgeCount}/${this.requiredDodges}`;
            this.instructionEl.textContent = `${this.currentProduct.name}을(를) 지키고 있습니다. 다음 공격을 피하세요.`;
            this.clearDirections();
            this.attackDirections = [];

            if (this.dodgeCount >= this.requiredDodges) {
                this.resolve(true);
                return;
            }

            setTimeout(() => this.showWave(), 300);
            return;
        }

        this.resolve(false);
    },

    resolve(isSuccess) {
        clearTimeout(this.battleTimeout);
        this.inBattle = false;
        this.attackDirections = [];
        this.clearDirections();
        this.overlayEl.classList.remove('active');
        this.setPlayerHandArt(this.currentProduct ? this.currentProduct.name : '중앙');

        if (this.onResolve) {
            this.onResolve(isSuccess, this.currentProduct);
            this.onResolve = null;
        }
    },

    reset() {
        clearTimeout(this.battleTimeout);
        this.inBattle = false;
        this.attackDirections = [];
        this.onResolve = null;
        this.clearDirections();
        if (this.overlayEl) this.overlayEl.classList.remove('active');
        if (this.playerUnitEl) {
            this.playerUnitEl.className = '';
        }
        if (this.playerHandEl) {
            this.setPlayerHandArt('중앙');
        }
    }
};