/** Pay-n-Tune inventory and upgrade state. Prices are charged by the game facade. */
export function createGarage(missions, persist) {
  return {
    open: false,
    paint: 0xb64d3e,
    upgrade: 0,
    turbo: false,
    repair() {
      this.open = false;
    },
    respray(color) {
      this.paint = color;
    },
    upgradeCar() {
      this.upgrade = Math.min(3, this.upgrade + 1);
    },
    installTurbo() {
      this.turbo = true;
    },
    save() {
      return persist({
        cash: missions.cash,
        respect: missions.respect,
        completed: missions.completed,
        paint: this.paint,
        upgrade: this.upgrade,
        turbo: this.turbo,
      });
    },
  };
}
