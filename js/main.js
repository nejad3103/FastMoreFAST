// 진입점: 모듈 초기화 및 게임 시작
window.addEventListener('DOMContentLoaded', () => {
    BattleManager.init();
    GameManager.init();
    GameManager.start();
});