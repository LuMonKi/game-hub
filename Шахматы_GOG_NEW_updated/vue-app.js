const { createApp } = Vue;

document.addEventListener('DOMContentLoaded', () => {

window.chessVue = createApp({
  data() {
    return {
      moves: [],
      turn: 'white'
    };
  },
  methods: {
    addMove(text) {
      this.moves.push(text);
      this.$nextTick(() => {
        const list = this.$refs.list;
        if (list) list.scrollTop = list.scrollHeight;
      });
    },
    clearMoves() {
      this.moves = [];
    },
    setTurn(t) {
      this.turn = t;
    }
  },
  template: `
    <div class="vue-sidebar">
      <div class="vue-turn" :class="turn === 'white' ? 'turn-white' : 'turn-black'">
        {{ turn === 'white' ? '⬜ Ход белых' : '⬛ Ход чёрных' }}
      </div>
      <div class="vue-history" ref="list">
        <p v-if="moves.length === 0" class="vue-empty">История ходов</p>
        <p
          v-for="(move, i) in moves"
          :key="i"
          class="vue-move"
          :class="i % 2 === 0 ? 'move-even' : 'move-odd'"
        >
          <span class="vue-move-num">{{ i + 1 }}.</span> {{ move }}
        </p>
      </div>
    </div>
  `
}).mount('#moveHistory');

});
