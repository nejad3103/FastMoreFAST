// 전체 게임 상태 및 타이머 관리
const GameManager = {
    allItems: [
        { name: '우유', sale: false },
        { name: '라면', sale: false },
        { name: '계란', sale: false },
        { name: '두부', sale: false },
        { name: '수박', sale: false },
        { name: '과자', sale: true },
        { name: '음료수', sale: true },
        { name: '빵', sale: true },
        { name: '치즈', sale: true },
        { name: '샐러드', sale: false }
    ],
    targetItems: [],
    collectedItems: [],
    timeLeft: 30,
    timerInterval: null,

    shelfEl: null,
    targetListUI: null,
    timeDisplayEl: null,
    resultScreenEl: null,
    resultTitleEl: null,
    resultDescEl: null,

    init() {
        this.shelfEl = document.getElementById('shelf');
        this.targetListUI = document.getElementById('target-list');
        this.timeDisplayEl = document.getElementById('time-display');
        this.resultScreenEl = document.getElementById('result-screen');
        this.resultTitleEl = document.getElementById('result-title');
        this.resultDescEl = document.getElementById('result-desc');

        document.getElementById('restart-btn').addEventListener('click', () => this.start());
    },

    getItemMeta(itemName) {
        return this.allItems.find(item => item.name === itemName) || { name: itemName, sale: false };
    },

    start() {
        this.resultScreenEl.classList.remove('active');
        BattleManager.reset();

        this.timeLeft = 30;
        this.timeDisplayEl.textContent = this.timeLeft;
        this.collectedItems = [];

        const shuffled = [...this.allItems].sort(() => 0.5 - Math.random());
        this.targetItems = shuffled.slice(0, 3).map(item => item.name);

        this.updateReceiptUI();
        this.spawnProducts();

        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.timeDisplayEl.textContent = this.timeLeft;
            if (this.timeLeft <= 0) {
                this.end(false, '시간이 끝나서 장보기에 실패했습니다.');
            }
        }, 1000);
    },

    updateReceiptUI() {
        this.targetListUI.innerHTML = '';
        this.targetItems.forEach(itemName => {
            const li = document.createElement('li');
            li.textContent = itemName;
            li.className = 'item-target';
            if (this.collectedItems.includes(itemName)) {
                li.classList.add('completed');
            }
            this.targetListUI.appendChild(li);
        });
    },

    spawnProducts() {
        this.shelfEl.innerHTML = '';
        const itemsToSpawn = [
            ...this.allItems
                .filter(item => this.targetItems.includes(item.name))
                .sort(() => 0.5 - Math.random()),
            ...this.allItems
                .filter(item => !this.targetItems.includes(item.name))
                .slice(0, 3)
                .sort(() => 0.5 - Math.random())
        ];

        itemsToSpawn.sort(() => 0.5 - Math.random());

        const slots = [
            { x: 90, y: 120 }, { x: 220, y: 120 }, { x: 350, y: 120 }, { x: 480, y: 120 }, { x: 610, y: 120 },
            { x: 110, y: 300 }, { x: 240, y: 300 }, { x: 370, y: 300 }, { x: 500, y: 300 }, { x: 630, y: 300 }
        ];

        itemsToSpawn.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'product';
            if (item.sale) {
                el.classList.add('sale-product');
            }
            el.textContent = item.name;

            const slot = slots[index % slots.length];
            el.style.left = slot.x + 'px';
            el.style.top = slot.y + 'px';

            el.addEventListener('click', () => {
                if (this.collectedItems.includes(item.name)) return;
                BattleManager.start(item.name, item.sale, el, (isSuccess, product) => this.onBattleEnd(isSuccess, product));
            });

            this.shelfEl.appendChild(el);
        });
    },

    onBattleEnd(isSuccess, product) {
        if (isSuccess) {
            if (this.targetItems.includes(product.name) && !this.collectedItems.includes(product.name)) {
                this.collectedItems.push(product.name);
                this.updateReceiptUI();
            }
            if (product && product.element) {
                product.element.remove();
            }

            if (this.collectedItems.length === this.targetItems.length) {
                this.end(true, '모든 목표 상품을 안전하게 챙기고 마트에서 빠져나왔습니다!');
            }
        } else {
            if (product && product.element) {
                product.element.remove();
            }
        }
    },

    end(isWin, message) {
        clearInterval(this.timerInterval);
        BattleManager.reset();

        this.shelfEl.innerHTML = '';

        this.resultTitleEl.textContent = isWin ? '장보기 성공!' : '장보기 실패';
        this.resultDescEl.textContent = message;
        this.resultScreenEl.classList.add('active');
    }
};