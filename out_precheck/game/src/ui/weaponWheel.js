/** Render the radial selector without adding controls to the live DOM twice. */
export function renderWeaponWheel(combat) {
  const element = document.getElementById('weapon-wheel');
  if (!element) return;
  if (!combat.wheel) {
    element.classList.add('hidden');
    return;
  }

  element.classList.remove('hidden');
  if (document.body.classList.contains('combat-shot')) {
    element.innerHTML = `<div class="combat-weapon-panel"><span>WEAPON WHEEL</span><b>TACTICAL RIFLE</b><small>1 PISTOL　2 MICRO SMG　3 SHOTGUN　4 RIFLE</small></div>`;
    return;
  }
  const options = combat.weapons.map((weapon, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / combat.weapons.length;
    const radius = Math.min(190, Math.min(innerWidth, innerHeight) * 0.27);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const selected = index + 1 === combat.weapon;
    return `
      <div class="weapon-option ${selected ? 'selected' : ''}"
           style="transform:translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px))">
        <span>${index + 1}</span>${weapon}
      </div>`;
  }).join('');

  element.innerHTML = `
    <div class="wheel-core">SELECT<br><b>${combat.weapons[combat.weapon - 1]}</b></div>
    ${options}`;
}
