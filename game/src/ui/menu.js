/** Build the title, pause, district map, garage and story result panels. */
export function showPanel(type, game) {
  const layer = document.getElementById('panel-layer');
  if (!layer) return;
  layer.innerHTML = '';
  if (!type) {
    layer.classList.add('hidden');
    return;
  }
  layer.classList.remove('hidden');

  if (type === 'title') {
    let hasSave = false;
    try { hasSave = Boolean(localStorage.getItem('solaris-bay.save.v1')); } catch {}
    layer.innerHTML = `
      <section class="title-panel">
        <div class="eyebrow">A CITY WITH NO QUIET EXITS</div>
        <h1>SOLARIS <i>BAY</i></h1>
        <div class="title-rule"></div>
        <p>NEON, SALT AIR &amp; SECOND CHANCES</p>
        <button id="start">ENTER THE BAY <b>↗</b></button>
        ${hasSave ? '<button id="continue">CONTINUE <b>↗</b></button>' : ''}
        <div class="title-foot">WASD DRIVE <span>SPACE DRIFT</span> E ENTER / EXIT <span>M MAP</span></div>
      </section>`;
    layer.querySelector('#start')?.addEventListener('click', () => game.start());
    layer.querySelector('#continue')?.addEventListener('click', () => { game.load(); game.start(); });
    return;
  }

  if (type === 'pause') {
    layer.innerHTML = `
      <section class="modal">
        <div class="eyebrow">SOLARIS BAY / PAUSED</div>
        <h2>TAKE A BREATH.</h2>
        <p>Press <b>ESC</b> to return to the street.</p>
        <button id="resume">RESUME DRIVE</button>
      </section>`;
    layer.querySelector('#resume')?.addEventListener('click', () => game.resume());
    return;
  }

  if (type === 'map') {
    layer.innerHTML = `
      <section class="map-panel">
        <div class="eyebrow">SOLARIS BAY • FIELD ATLAS</div>
        <h2>FOUR DISTRICTS. ONE WAY OUT.</h2>
        <div class="map-layout">
          <div class="city-map">
            <div class="map-water"></div><div class="map-road"></div>
            <span class="map-label coast">SUNSET COAST</span>
            <span class="map-label downtown">NEON DOWNTOWN</span>
            <span class="map-label docks">HARBOR DOCKS</span>
            <span class="map-label island">CORAL ISLAND</span>
            <b class="map-pin">YOU ARE HERE</b>
          </div>
          <div class="map-list">${renderMissionRows(game)}</div>
        </div>
        <button id="close">CLOSE MAP　ESC</button>
      </section>`;
    layer.querySelector('#close')?.addEventListener('click', () => game.resume());
    return;
  }

  if (type === 'garage') {
    layer.innerHTML = `
      <section class="map-panel garage-screen">
        <div class="eyebrow">PAY N TUNE / CORAL ISLAND</div>
        <h2>MAKE IT YOURS.</h2>
        <div class="map-layout">
          <canvas class="city-map garage-map-canvas" width="720" height="240" aria-label="Solaris Bay city map"></canvas>
          <div class="garage-tools">
            <div class="eyebrow">CUSTOM PAINT / $450</div>
            <div class="garage-grid">
              <button data-color="11949118">SOLARA RED</button>
              <button data-color="2984080">DEEP CURRENT</button>
              <button data-color="14474468">SALT WHITE</button>
              <button data-color="16752694">SUNSET GOLD</button>
              <button data-color="3048747">NIGHT JADE</button>
              <button data-color="7902926">VIOLET RUSH</button>
            </div>
            <p>DRIFT TUNE　${game.garage.upgrade}/3　•　CASH $${game.missions.cash.toLocaleString()}</p>
            <button id="upgrade">INSTALL DRIFT TUNE — $3,500</button>
            <button id="turbo">INSTALL TURBO — $6,000</button>
            <button id="repair">REPAIR &amp; SERVICE — $750</button>
            <div class="eyebrow">STORY CONTRACTS</div>
            <div class="map-list">${renderMissionRows(game)}</div>
            <button id="save">SAVE GAME</button>
            <button id="load">LOAD GAME</button>
            <button id="close">LEAVE GARAGE</button>
          </div>
        </div>
      </section>`;
    layer.querySelectorAll('[data-color]').forEach((button) => {
      button.addEventListener('click', () => game.paint(Number(button.dataset.color)));
    });
    drawGarageMap(layer.querySelector('.garage-map-canvas'));
    layer.querySelector('#upgrade')?.addEventListener('click', () => game.upgrade());
    layer.querySelector('#turbo')?.addEventListener('click', () => game.turbo());
    layer.querySelector('#repair')?.addEventListener('click', () => game.repair?.());
    layer.querySelector('#save')?.addEventListener('click', () => game.save());
    layer.querySelector('#load')?.addEventListener('click', () => game.load());
    layer.querySelector('#close')?.addEventListener('click', () => {
      document.body.classList.remove('garage-shot');
      game.resume();
    });
    return;
  }

  if (type === 'result') {
    layer.innerHTML = `
      <section class="modal result">
        <div class="eyebrow">STORY CHAPTER COMPLETE</div>
        <h2>MISSION PASSED</h2>
        <p>THE BAY REMEMBERS WHO SHOWED UP.</p>
        <button id="next">CONTINUE STORY　↗</button>
      </section>`;
    layer.querySelector('#next')?.addEventListener('click', () => game.nextMission());
  }
}

/** Locally draw the four landmasses, road network, districts, bridge and map pins. */
function drawGarageMap(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d'); const w = canvas.width; const h = canvas.height;
  ctx.fillStyle = '#12394e'; ctx.fillRect(0, 0, w, h);
  const land = (points, color) => { ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x*w,y*h) : ctx.moveTo(x*w,y*h)); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); };
  land([[0,.05],[.32,.04],[.36,.18],[.32,.34],[.39,.52],[.33,.76],[.23,.93],[.08,.78],[0,.64]], '#9a8365');
  land([[.28,.18],[.72,.14],[.77,.42],[.67,.67],[.48,.61],[.31,.47]], '#747e79');
  land([[.53,.58],[.94,.56],[.98,.94],[.58,.94]], '#777d79');
  land([[.54,.03],[.91,.04],[.93,.37],[.73,.44],[.55,.29]], '#687c69');
  ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#e1bd78';ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(w*.08,h*.19);ctx.bezierCurveTo(w*.27,h*.1,w*.35,h*.25,w*.27,h*.37);ctx.bezierCurveTo(w*.16,h*.53,w*.31,h*.68,w*.48,h*.55);ctx.stroke();
  ctx.strokeStyle='#363e43';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(w*.26,h*.5);ctx.lineTo(w*.73,h*.51);ctx.moveTo(w*.46,h*.22);ctx.lineTo(w*.46,h*.72);ctx.moveTo(w*.63,h*.2);ctx.lineTo(w*.63,h*.72);ctx.stroke();
  ctx.strokeStyle='#54e7f5';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(w*.68,h*.41);ctx.lineTo(w*.68,h*.79);ctx.stroke();
  ctx.font='bold 16px Chakra,Arial';ctx.fillStyle='#ffe4ae';ctx.shadowColor='#06121b';ctx.shadowBlur=5;
  ctx.fillText('SUNSET COAST',18,28);ctx.fillText('NEON DOWNTOWN',w*.36,58);ctx.fillText('HARBOR DOCKS',w*.52,h*.88);ctx.fillText('CORAL ISLAND',w*.73,h*.37);
  ctx.shadowBlur=0;ctx.fillStyle='#ffd264';ctx.beginPath();ctx.arc(w*.77,h*.77,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f2f0dc';ctx.fillText('PAY N TUNE',w*.78,h*.81);
  for (const [x,y,c] of [[.12,.29,'#ff586d'],[.47,.38,'#ffcf67'],[.57,.72,'#64eaff'],[.81,.23,'#ffcf67']]) { ctx.fillStyle=c;ctx.beginPath();ctx.arc(w*x,h*y,5,0,Math.PI*2);ctx.fill(); }
  ctx.fillStyle='#68f0e7';ctx.beginPath();ctx.moveTo(w*.58,h*.46);ctx.lineTo(w*.58-6,h*.48);ctx.lineTo(w*.58+6,h*.48);ctx.closePath();ctx.fill();
}

function renderMissionRows(game) {
  return game.missions.map.map((mission, index) => `
    <div class="mission-row ${index === game.missions.index ? 'active' : ''}">
      <small>${mission[0]}　${mission[3]}</small>
      <b>${mission[1]}</b>
      <span>${index < game.missions.index ? 'COMPLETE' : index === game.missions.index ? 'CURRENT OBJECTIVE' : 'LOCKED'}</span>
    </div>`).join('');
}
