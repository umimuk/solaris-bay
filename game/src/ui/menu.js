function u(i,t){let e=document.getElementById("panel-layer");if(!e)return;if(e.innerHTML="",e.classList.toggle("title-screen",i==="title"),!i){e.classList.add("hidden");return}if(e.classList.remove("hidden"),i==="title"){let l=!1;try{l=Boolean(localStorage.getItem("solaris-bay.save.v1"))}catch{}e.innerHTML=`
      <section class="title-panel">
        <h1 class="title-logo">SOLARIS <i>BAY</i></h1>
        <div class="title-rule"></div>
        <p>A LIVING COASTAL CRIME SANDBOX</p>
        <div class="title-actions"><button id="continue">CONTINUE <b>➜</b></button><button id="start">NEW GAME</button><button id="load">LOAD GAME</button><button id="garage-menu">PAY N TUNE GARAGE</button><button id="settings-menu">SETTINGS</button><button id="controls">CONTROLS</button></div>
        <div class="title-foot">${l?"CHAPTER 05 • $24,850 • REP 420":"SAVE SLOT READY • CHAPTER 05 • $24,850 • REP 420"}<span>WASD DRIVE • SPACE DRIFT • E EXIT • M MAP</span></div>
      </section>`,e.querySelector("#start")?.addEventListener("click",()=>t.start()),e.querySelector("#continue")?.addEventListener("click",()=>{if(l)t.load();t.start()}),e.querySelector("#load")?.addEventListener("click",()=>{if(!t.load())e.querySelector(".title-foot").textContent="NO SAVE FOUND • START A NEW GAME TO BEGIN";else t.start()}),e.querySelector("#garage-menu")?.addEventListener("click",()=>t.showPanel("garage")),e.querySelector("#settings-menu")?.addEventListener("click",()=>{e.querySelector(".title-foot").textContent="AUDIO • DISPLAY • ACCESSIBILITY"}),e.querySelector("#controls")?.addEventListener("click",()=>{e.querySelector(".title-foot").textContent="WASD DRIVE • SPACE DRIFT • E EXIT / ENTER • F CARJACK • M CITY MAP • R WEATHER"});return}if(i==="pause"){e.innerHTML=`
      <section class="modal">
        <div class="eyebrow">SOLARIS BAY / PAUSED</div>
        <h2>TAKE A BREATH.</h2>
        <p>Press <b>ESC</b> to return to the street.</p>
        <button id="resume">RESUME DRIVE</button>
      </section>`,e.querySelector("#resume")?.addEventListener("click",()=>t.resume());return}if(i==="map"){e.innerHTML=`
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
          <div class="map-list">${c(t)}</div>
        </div>
        <button id="close">CLOSE MAP　ESC</button>
      </section>`,e.querySelector("#close")?.addEventListener("click",()=>t.resume());return}if(i==="garage"){e.innerHTML=`
      <section class="map-panel garage-screen">
        <div class="eyebrow">PAY N TUNE / CORAL ISLAND</div>
        <h2>MAKE IT YOURS.</h2>
        <div class="garage-stats"><b>8 <small>MISSIONS</small></b><b>12 <small>ACTIVITIES</small></b><b>8 <small>VEHICLES</small></b><b>5 <small>WEAPONS</small></b><b>4 <small>DISTRICTS</small></b></div>
        <div class="map-layout">
          <canvas class="city-map garage-map-canvas" width="720" height="240" aria-label="Solaris Bay city map"></canvas>
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
            <p>DRIFT TUNE　${t.garage.upgrade}/3　•　CASH $${t.missions.cash.toLocaleString()}</p>
            <button id="upgrade">INSTALL DRIFT TUNE — $3,500</button>
            <button id="turbo">INSTALL TURBO — $6,000</button>
            <button id="repair">REPAIR &amp; SERVICE — $750</button>
            <div class="eyebrow">STORY CONTRACTS</div>
            <div class="map-list">${c(t)}</div>
            <button id="save">SAVE GAME</button>
            <button id="load">LOAD GAME</button>
            <button id="close">LEAVE GARAGE</button>
          </div>
        </div>
      </section>`,e.querySelectorAll("[data-color]").forEach((l)=>{l.addEventListener("click",()=>t.paint(Number(l.dataset.color)))}),E(e.querySelector(".garage-map-canvas")),e.querySelector("#upgrade")?.addEventListener("click",()=>t.upgrade()),e.querySelector("#turbo")?.addEventListener("click",()=>t.turbo()),e.querySelector("#repair")?.addEventListener("click",()=>t.repair?.()),e.querySelector("#save")?.addEventListener("click",()=>t.save()),e.querySelector("#load")?.addEventListener("click",()=>t.load()),e.querySelector("#close")?.addEventListener("click",()=>{document.body.classList.remove("garage-shot"),t.resume()});return}if(i==="result")e.innerHTML=`
      <section class="modal result">
        <div class="eyebrow">STORY CHAPTER COMPLETE</div>
        <h2>MISSION PASSED</h2>
        <p>THE BAY REMEMBERS WHO SHOWED UP.</p>
        <button id="next">CONTINUE STORY　↗</button>
      </section>`,e.querySelector("#next")?.addEventListener("click",()=>t.nextMission())}function E(i){if(!i)return;let t=i.getContext("2d"),e=i.width,l=i.height;t.fillStyle="#12394e",t.fillRect(0,0,e,l);let s=(o,n)=>{t.beginPath(),o.forEach(([a,r],d)=>d?t.lineTo(a*e,r*l):t.moveTo(a*e,r*l)),t.closePath(),t.fillStyle=n,t.fill()};s([[0,0.05],[0.32,0.04],[0.36,0.18],[0.32,0.34],[0.39,0.52],[0.33,0.76],[0.23,0.93],[0.08,0.78],[0,0.64]],"#9a8365"),s([[0.28,0.18],[0.72,0.14],[0.77,0.42],[0.67,0.67],[0.48,0.61],[0.31,0.47]],"#747e79"),s([[0.53,0.58],[0.94,0.56],[0.98,0.94],[0.58,0.94]],"#777d79"),s([[0.54,0.03],[0.91,0.04],[0.93,0.37],[0.73,0.44],[0.55,0.29]],"#687c69"),t.lineCap="round",t.lineJoin="round",t.strokeStyle="#e1bd78",t.lineWidth=7,t.beginPath(),t.moveTo(e*0.08,l*0.19),t.bezierCurveTo(e*0.27,l*0.1,e*0.35,l*0.25,e*0.27,l*0.37),t.bezierCurveTo(e*0.16,l*0.53,e*0.31,l*0.68,e*0.48,l*0.55),t.stroke(),t.strokeStyle="#363e43",t.lineWidth=10,t.beginPath(),t.moveTo(e*0.26,l*0.5),t.lineTo(e*0.73,l*0.51),t.moveTo(e*0.46,l*0.22),t.lineTo(e*0.46,l*0.72),t.moveTo(e*0.63,l*0.2),t.lineTo(e*0.63,l*0.72),t.stroke(),t.strokeStyle="#54e7f5",t.lineWidth=4,t.beginPath(),t.moveTo(e*0.68,l*0.41),t.lineTo(e*0.68,l*0.79),t.stroke(),t.font="bold 16px Chakra,Arial",t.fillStyle="#ffe4ae",t.shadowColor="#06121b",t.shadowBlur=5,t.fillText("SUNSET COAST",18,28),t.fillText("NEON DOWNTOWN",e*0.36,58),t.fillText("HARBOR DOCKS",e*0.52,l*0.88),t.fillText("CORAL ISLAND",e*0.73,l*0.37),t.shadowBlur=0,t.fillStyle="#ffd264",t.beginPath(),t.arc(e*0.77,l*0.77,7,0,Math.PI*2),t.fill(),t.fillStyle="#f2f0dc",t.fillText("PAY N TUNE",e*0.78,l*0.81);for(let[o,n,a]of[[0.12,0.29,"#ff586d"],[0.47,0.38,"#ffcf67"],[0.57,0.72,"#64eaff"],[0.81,0.23,"#ffcf67"]])t.fillStyle=a,t.beginPath(),t.arc(e*o,l*n,5,0,Math.PI*2),t.fill();t.fillStyle="#68f0e7",t.beginPath(),t.moveTo(e*0.58,l*0.46),t.lineTo(e*0.58-6,l*0.48),t.lineTo(e*0.58+6,l*0.48),t.closePath(),t.fill()}function c(i){return i.missions.map.map((t,e)=>`
    <div class="mission-row ${e===i.missions.index?"active":""}">
      <small>${t[0]}　${t[3]}</small>
      <b>${t[1]}</b>
      <span>${e<i.missions.index?"COMPLETE":e===i.missions.index?"CURRENT OBJECTIVE":"LOCKED"}</span>
    </div>`).join("")}export{u as showPanel};
