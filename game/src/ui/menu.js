/** Build the title, pause, district map, garage and story result panels. */
export function showPanel(type, game) {
  const layer = document.getElementById('panel-layer');
  if (!layer) return;
  layer.innerHTML = '';
  layer.classList.toggle('title-screen', type === 'title');
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
        <div class="title-crest" aria-hidden="true">☀</div>
        <div class="eyebrow">SUNSET COAST • CHAPTER 05</div>
        <h1 class="title-logo" aria-label="SOLARIS BAY"><svg viewBox="0 0 620 184" role="img" aria-hidden="true"><defs><linearGradient id="chrome-sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".22" stop-color="#b9f7ff"/><stop offset=".46" stop-color="#fff4cb"/><stop offset=".68" stop-color="#ffb14e"/><stop offset="1" stop-color="#e74e45"/></linearGradient><linearGradient id="sunset-disc" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffd14e"/><stop offset="1" stop-color="#fb654b"/></linearGradient></defs><circle cx="482" cy="72" r="55" fill="url(#sunset-disc)"/><path d="M428 72h108M436 88h92M448 104h68M465 120h34" stroke="#153048" stroke-width="8"/><text x="12" y="95" fill="url(#chrome-sunset)" stroke="#102537" stroke-width="5" paint-order="stroke" font-family="Arial,sans-serif" font-size="77" font-weight="900" font-style="italic" letter-spacing="-5">SOLARIS</text><text x="250" y="166" fill="url(#chrome-sunset)" stroke="#102537" stroke-width="5" paint-order="stroke" font-family="Arial,sans-serif" font-size="68" font-weight="900" font-style="italic" letter-spacing="8">BAY</text></svg></h1>
        <div class="title-rule"></div>
        <p>A LIVING COASTAL CRIME STORY</p>
        <div class="title-actions"><button id="start">NEW GAME <b>↗</b></button><button id="continue" class="selected">CONTINUE <b>↗</b></button><button id="load">LOAD GAME <b>↗</b></button><button id="garage">PAY N TUNE GARAGE <b>↗</b></button><button id="settings">SETTINGS <b>⚙</b></button><button id="controls">CONTROLS <b>⌘</b></button></div>
        <div class="title-foot">${hasSave ? 'CHAPTER 05 • $48,250 • REP 420' : 'SAVE SLOT READY • CHAPTER 05 • $48,250 • REP 420'}<span>WASD DRIVE • SPACE DRIFT • E EXIT • M MAP</span></div>
      </section>`;
    layer.querySelector('#start')?.addEventListener('click', () => game.start());
    layer.querySelector('#continue')?.addEventListener('click', () => { if (hasSave) game.load(); game.start(); });
    layer.querySelector('#load')?.addEventListener('click', () => { if (!game.load()) layer.querySelector('.title-foot').textContent = 'NO SAVE FOUND • START A NEW GAME TO BEGIN'; else game.start(); });
    layer.querySelector('#controls')?.addEventListener('click', () => { layer.querySelector('.title-foot').textContent = 'WASD DRIVE • SPACE DRIFT • E EXIT / ENTER • F CARJACK • M CITY MAP • R WEATHER'; });
    layer.querySelector('#garage')?.addEventListener('click', () => game.showPanel('garage'));
    layer.querySelector('#settings')?.addEventListener('click', () => { layer.querySelector('.title-foot').textContent = 'DISPLAY: FULL SCREEN • AUDIO: STEREO • CAMERA: CINEMATIC'; });
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
      <section class="garage-screen">
        <header class="dossier-header"><div class="dossier-heading"><div class="eyebrow">SOLARIS BAY // COMMAND DOSSIER</div><h2>OPEN WORLD <span>•</span> PROGRESSION</h2></div><nav class="dossier-nav"><b>MAP</b><span>MISSIONS</span><span>STATS</span><span>GARAGE</span><span>SETTINGS</span><span>SAVE</span><span>RESUME</span></nav></header>
        <div class="garage-stats"><b>10 <small>MISSIONS</small></b><b>28 <small>ACTIVITIES</small></b><b>18 <small>VEHICLES</small></b><b>8 <small>WEAPONS</small></b><b>6 <small>DISTRICTS</small></b><b>3 <small>RADIO</small></b></div>
        <div class="dossier-layout">
          <div class="dossier-left">
            <section class="dossier-card district-map-card"><div class="card-heading"><b>LIVE CITY MAP</b><span>6 DISTRICTS / ACTIVE ROUTE</span></div><canvas class="city-map garage-map-canvas" width="900" height="390" aria-label="Solaris Bay tactical city map"></canvas></section>
            <section class="dossier-card mission-track"><div class="card-heading"><b>MISSION PROGRESSION</b><span>NEXT: SUNSET HEIST</span></div><div class="mission-numbers">${Array.from({length:10},(_,i)=>`<b class="${i<6?'complete':i===6?'current':''}">${i+1}</b>`).join('')}</div><div class="pin-legend"><span><i>M</i> MISSION</span><span><i>G</i> GARAGE</span><span><i>R</i> RESPRAY</span><span><i>W</i> WEAPONS</span><span><i>S</i> SAFEHOUSE</span><span><i>$</i> BUSINESS</span><span><i>F</i> RACE</span><span><i>J</i> JUMP</span><span><i>P</i> SBPD</span></div></section>
            <section class="dossier-card showroom-card"><div class="card-heading"><b>PAY N TUNE / LIVE SHOWROOM</b><span>STUDIO LIGHT / 360° TURNTABLE</span></div><div class="showroom-overlay"><strong>SOLARIS GT</strong><span>METALLIC CYAN • TWIN TURBO</span><i>DRIFT SPEC / 94 TOP SPEED</i></div>
              <div class="garage-tools">
            <div class="eyebrow">CUSTOM PAINT / $450</div>
            <div class="garage-grid">
              <button data-color="11949118"><i style="--swatch:#b6665e"></i>SOLARA RED</button>
              <button data-color="2984080"><i style="--swatch:#2d9490"></i>DEEP CURRENT</button>
              <button data-color="14474468"><i style="--swatch:#dedbd1"></i>SALT WHITE</button>
              <button data-color="16752694"><i style="--swatch:#e9aa56"></i>SUNSET GOLD</button>
              <button data-color="3048747"><i style="--swatch:#2e9a78"></i>NIGHT JADE</button>
              <button data-color="7902926"><i style="--swatch:#78528e"></i>VIOLET RUSH</button>
            </div>
            <p>DRIFT TUNE　${game.garage.upgrade}/3　•　CASH $${game.missions.cash.toLocaleString()}</p>
            <button id="upgrade">INSTALL DRIFT TUNE — $3,500</button>
            <button id="turbo">INSTALL TURBO — $6,000</button>
            <button id="repair">REPAIR &amp; SERVICE — $750</button>
            <div class="eyebrow">STORY CONTRACTS</div>
            <div class="map-list">${renderMissionRows(game)}</div>
              </div>
            </section>
          </div>
          <aside class="dossier-right">
            <section class="dossier-card progress-dossier"><div class="card-heading"><b>SOLARIS BAY · 48% COMPLETION</b><span>RANK 5 · CREW BOSS</span></div><div class="completion-grid"><span>STORY <b>6/10</b></span><span>RACES <b>3/8</b></span><span>PROPERTIES <b>2/6</b></span><span>COLLECTIBLES <b>14/40</b></span></div></section>
            <section class="dossier-card economy-card"><div class="card-heading"><b>GARAGE &amp; GUN SHOP</b><span>WALLET $48,250</span></div><div class="shop-grid"><span>ENGINE TUNE 1 <b>$4,000</b></span><span>RESPRAY <b>$250</b></span><span>BODY ARMOUR <b>$800</b></span><span>TACTICAL SMG <b>$3,100</b></span><span>CARBINE AR <b>$7,800</b></span><span>SNIPER 308 <b>$12,500</b></span></div><div class="crew-favours">CREW FAVOURS <span>MARA — ROADSIDE REPAIR <b>READY</b></span><span>NIKO — DROP A STAR <b>READY</b></span></div></section>
            <section class="dossier-card compact-showroom"><div class="card-heading"><b>LIVE 3D SHOWROOM</b><span>PAY N TUNE</span></div><div class="showroom-overlay"><strong>SOLARIS GT</strong><span>METALLIC CYAN • TWIN TURBO</span><i>DRIFT SPEC / 94 TOP SPEED</i></div></section>
            <div class="save-slots"><div class="save-slot active">SAVE 1 · SUNSET COAST · 48% · $48,250 <b>[ACTIVE]</b></div><div class="save-slot">SAVE 2 · NEON DOWNTOWN · 30% · $19,800</div><div class="save-slot">SAVE 3 · HARBOR DOCKS · 15% · $6,150</div></div>
            <div class="dossier-actions"><button id="save">SAVE GAME</button><button id="load">LOAD GAME</button><button id="close">RESUME</button></div>
          </aside>
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
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#071a2c'; ctx.fillRect(0, 0, w, h);
  const district = (color, points) => { ctx.beginPath(); points.forEach(([x,y], index) => index ? ctx.lineTo(w*x,h*y) : ctx.moveTo(w*x,h*y)); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); };
  district('rgba(223,163,68,.58)', [[0,0],[.2,0],[.27,.18],[.24,.4],[.3,.6],[.22,.84],[.14,1],[0,1]]);
  district('rgba(169,84,191,.55)', [[.29,0],[.7,0],[.8,.12],[.73,.34],[.65,.58],[.38,.63],[.28,.39]]);
  district('rgba(38,173,173,.5)', [[.53,.62],[1,.54],[1,1],[.64,1]]);
  district('rgba(47,112,194,.55)', [[.2,.7],[.53,.68],[.61,1],[.16,1]]);
  district('rgba(86,155,91,.42)', [[.73,.04],[.93,.02],[1,.14],[.9,.29],[.78,.3],[.71,.19]]);
  district('rgba(205,102,88,.35)', [[.31,.57],[.58,.59],[.67,.74],[.56,.9],[.39,.83],[.27,.72]]);
  ctx.strokeStyle = 'rgba(226,247,244,.58)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w*.2,0); ctx.bezierCurveTo(w*.35,h*.2,w*.24,h*.39,w*.4,h*.54); ctx.bezierCurveTo(w*.53,h*.68,w*.47,h*.83,w*.63,h); ctx.stroke();
  ctx.fillStyle = '#0b3448'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(w*.22,0); ctx.lineTo(w*.31,h*.19); ctx.lineTo(w*.25,h*.38); ctx.lineTo(w*.34,h*.56); ctx.lineTo(w*.27,h*.79); ctx.lineTo(w*.18,h); ctx.lineTo(0,h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#176176'; ctx.beginPath(); ctx.moveTo(w*.55,0); ctx.lineTo(w*.86,0); ctx.lineTo(w*.9,h*.2); ctx.lineTo(w*.82,h*.35); ctx.lineTo(w*.72,h*.42); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8d9e73'; ctx.beginPath(); ctx.ellipse(w*.78,h*.18,w*.075,h*.085,-.18,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#d9c489';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(w*.63,h*.58);ctx.quadraticCurveTo(w*.79,h*.4,w*.83,h*.24);ctx.stroke();
  ctx.fillStyle = '#0c3246'; ctx.beginPath(); ctx.moveTo(w*.57,h*.61); ctx.lineTo(w,h*.57); ctx.lineTo(w,h); ctx.lineTo(w*.63,h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#63dce5'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w*.28,0); ctx.bezierCurveTo(w*.34,h*.18,w*.23,h*.27,w*.32,h*.42); ctx.bezierCurveTo(w*.41,h*.55,w*.47,h*.69,w*.59,h*.61); ctx.stroke();
  ctx.fillStyle = '#283748';
  for (let row = 0; row < 7; row++) for (let column = 0; column < 18; column++) {
    const x = w * (.285 + column * .038 + (row % 2) * .008); const y = h * (.055 + row * .083);
    const width = w * (.026 + (column % 3) * .002); const height = h * (.047 + (row % 2) * .006);
    ctx.fillStyle = ['#405365','#526271','#324958','#63717a'][((row * 13 + column) * 7) % 4]; ctx.fillRect(x,y,width,height);
    ctx.fillStyle = 'rgba(246,196,123,.74)'; for(let wx=0;wx<3;wx++)for(let wy=0;wy<2;wy++)if((row+column+wx+wy)%3===0)ctx.fillRect(x+4+wx*8,y+4+wy*7,3,3);
    ctx.strokeStyle = '#778c91'; ctx.lineWidth = 1; ctx.strokeRect(x,y,width,height);
  }
  ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#c3a466';ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(w*.07,h*.27);ctx.bezierCurveTo(w*.18,h*.08,w*.31,h*.24,w*.42,h*.39);ctx.bezierCurveTo(w*.54,h*.55,w*.5,h*.83,w*.69,h*.73);ctx.stroke();
  ctx.strokeStyle='#abb8b7';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(w*.24,h*.42);ctx.lineTo(w*.88,h*.48);ctx.moveTo(w*.54,h*.19);ctx.lineTo(w*.52,h*.83);ctx.stroke();
  ctx.strokeStyle='#dae3dc';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.23,h*.41);ctx.lineTo(w*.9,h*.47);ctx.stroke();
  ctx.setLineDash([5,5]);ctx.strokeStyle='#42f0ef';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(w*.17,h*.31);ctx.bezierCurveTo(w*.3,h*.2,w*.44,h*.7,w*.66,h*.54);ctx.bezierCurveTo(w*.73,h*.5,w*.71,h*.69,w*.82,h*.76);ctx.stroke();ctx.setLineDash([]);
  ctx.font='bold 15px Chakra,Arial';ctx.fillStyle='#fff0c2';ctx.shadowColor='#02080f';ctx.shadowBlur=5;
  ctx.fillText('SUNSET COAST',14,24);ctx.fillText('NEON DOWNTOWN',w*.4,34);ctx.fillText('HARBOR DOCKS',w*.65,h*.91);ctx.fillText('OLD MARINA',w*.4,h*.78);ctx.fillText('PALM HEIGHTS',w*.72,h*.31);ctx.fillText('CORAL ISLE',w*.73-14,h*.14+14);
  ctx.shadowBlur=0;
  const pins=[['M',.13,.28,'#ff6476'],['G',.45,.34,'#ffd36f'],['R',.57,.73,'#5ff5fa'],['W',.82,.22,'#ffc664'],['S',.2,.52,'#b7ef90'],['$',.78,.63,'#61e3aa'],['F',.39,.21,'#ff944e'],['J',.69,.49,'#e590ff'],['P',.11,.75,'#77bfff'],['M',.36,.49,'#ff6476'],['G',.51,.16,'#ffd36f'],['R',.62,.27,'#5ff5fa'],['W',.7,.8,'#ffc664'],['S',.23,.9,'#b7ef90'],['$',.91,.71,'#61e3aa'],['F',.32,.81,'#ff944e'],['J',.57,.9,'#e590ff'],['P',.88,.39,'#77bfff'],['M',.48,.57,'#ff6476'],['G',.15,.42,'#ffd36f'],['R',.84,.57,'#5ff5fa'],['W',.32,.68,'#ffc664'],['$',.74,.1,'#61e3aa'],['F',.53,.42,'#ff944e'],['M',.24,.14,'#ff6476'],['P',.93,.23,'#77bfff']];
  for (const [label,x,y,color] of pins) { ctx.fillStyle='rgba(4,13,23,.88)';ctx.beginPath();ctx.arc(w*x,h*y,13,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=color;ctx.font='900 12px Chakra,Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,w*x,h*y+1); }
  for (const [x,y] of [[.2,.52],[.78,.63]]) { ctx.fillStyle='#ffd16f';ctx.beginPath();ctx.moveTo(w*x,h*y-8);ctx.lineTo(w*x+8,h*y);ctx.lineTo(w*x,h*y+8);ctx.lineTo(w*x-8,h*y);ctx.closePath();ctx.fill();ctx.fillStyle='#6be2e9';ctx.fillRect(w*x-3,h*y-3,6,6); }
  ctx.fillStyle='#f5eee0';ctx.font='bold 11px Chakra,Arial';ctx.fillText('PAY N TUNE',w*.74+18,h*.8);
}

function renderMissionRows(game) {
  return game.missions.map.map((mission, index) => `
    <div class="mission-row ${index === game.missions.index ? 'active' : ''}">
      <small>${mission[0]}　${mission[3]}</small>
      <b>${mission[1]}</b>
      <span>${index < game.missions.index ? 'COMPLETE' : index === game.missions.index ? 'CURRENT OBJECTIVE' : 'LOCKED'}</span>
    </div>`).join('');
}
