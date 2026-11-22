import*as e from"../../vendor/three.module.min.js";import{createRandom as w}from"../random.js";var u={sunset:{upper:"#2f8ed4",middle:"#7ec8f2",horizon:"#ffe6b8",sun:"#fff4d8"},golden:{upper:"#2f8ed4",middle:"#7ec8f2",horizon:"#ffe6b8",sun:"#fff4d8"},twilight:{upper:"#584d79",middle:"#c57b78",horizon:"#ffc77f",sun:"#fff0c2"},"wet-night":{upper:"#080d24",middle:"#171a3d",horizon:"#303451",sun:"#f05d68"},midnight:{upper:"#050916",middle:"#101a32",horizon:"#263049",sun:"#9ab8e8"},harbor:{upper:"#19213d",middle:"#696076",horizon:"#efa16a",sun:"#ffd28b"},garage:{upper:"#1b2437",middle:"#4c566d",horizon:"#d48f67",sun:"#ffd18e"}};function b(o,d=1){let t=new e.ShaderMaterial({side:e.BackSide,depthWrite:!1,uniforms:{horizonColor:{value:new e.Color(u.sunset.horizon)},middleColor:{value:new e.Color(u.sunset.middle)},zenithColor:{value:new e.Color(u.sunset.upper)},sunDirection:{value:new e.Vector3(-0.66,0.16,-0.73).normalize()},sunColor:{value:new e.Color(u.sunset.sun)}},vertexShader:`
      varying vec3 vWorldDirection;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldDirection = normalize(worldPosition.xyz - cameraPosition);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      varying vec3 vWorldDirection;
      uniform vec3 horizonColor;
      uniform vec3 middleColor;
      uniform vec3 zenithColor;
      uniform vec3 sunDirection;
      uniform vec3 sunColor;
      void main() {
        float height = normalize(vWorldDirection).y;
        float horizon = 1.0 - smoothstep(-0.02, 0.46, abs(height));
        vec3 sky = mix(middleColor, zenithColor, smoothstep(0.0, 0.72, height));
        sky = mix(sky, horizonColor, horizon * (0.72 + 0.28 * (1.0 - smoothstep(-0.08, 0.08, height))));
        float sunAngle = acos(clamp(dot(normalize(vWorldDirection), normalize(sunDirection)), -1.0, 1.0));
        float disc = 1.0 - smoothstep(0.018, 0.026, sunAngle);
        float halo = exp(-sunAngle * 34.0) * 0.52;
        sky += sunColor * (disc * 2.8 + halo * horizon);
        gl_FragColor = vec4(sky, 1.0);
      }
    `}),r=new e.Mesh(new e.SphereGeometry(1200,48,32),t);r.renderOrder=-10,o.add(r);let l=new e.HemisphereLight(14677247,14205861,1.35),s=new e.DirectionalLight(16773590,2.2);s.position.set(-80,24,-95);let f=new e.AmbientLight(7704757,0.34);o.add(l,s,f);let i=w(d),a=new Float32Array(1800);for(let n=0;n<600;n++){let g=i()*Math.PI*2,v=500+i()*350;a[n*3]=Math.cos(g)*v,a[n*3+1]=50+i()*650,a[n*3+2]=Math.sin(g)*v}let m=new e.BufferGeometry;m.setAttribute("position",new e.BufferAttribute(a,3));let p=new e.Points(m,new e.PointsMaterial({color:13952511,size:1.25,transparent:!0,opacity:0.72,sizeAttenuation:!1}));o.add(p);let c=new Float32Array(3000);for(let n=0;n<1000;n++)c[n*3]=(i()-0.5)*100,c[n*3+1]=i()*72,c[n*3+2]=(i()-0.5)*100;let E=new e.BufferGeometry;E.setAttribute("position",new e.BufferAttribute(c,3));let h=new e.Points(E,new e.PointsMaterial({color:11196658,size:0.14,transparent:!0,opacity:0.64,depthWrite:!1}));return h.visible=!1,o.add(h),{dome:r,hemisphere:l,sun:s,ambient:f,stars:p,rain:h,time:0.72,mode:"sunset"}}function H(o,d,t="sunset"){let r=u[t]||u.sunset;o.mode=t,o.time=(o.time+d*0.004)%1;let l=o.dome.material.uniforms;l.horizonColor.value.set(r.horizon),l.middleColor.value.set(r.middle),l.zenithColor.value.set(r.upper),l.sunColor.value.set(r.sun);let s=t==="midnight"||t==="wet-night";if(o.sun.intensity=t==="sunset"||t==="golden"||t==="harbor"?2.2:t==="twilight"?1.65:t==="garage"?1.55:t==="wet-night"?0.46:0.16,o.sun.color.set(t==="garage"?"#f7c99a":r.sun),o.hemisphere.intensity=s?0.86:t==="twilight"?1.15:t==="garage"?0.9:1.35,o.hemisphere.color.set(s?"#7389cf":t==="twilight"?"#ffd3b2":"#dff4ff"),o.ambient.intensity=s?0.88:t==="garage"?0.82:0.52,o.stars.material.opacity=s?0.84:0.12,o.rain.visible=t==="wet-night",o.rain.visible){let f=o.rain.geometry.attributes.position;for(let i=0;i<f.count;i++){let a=f.getY(i)-d*55;if(a<0)a=72;f.setY(i,a)}f.needsUpdate=!0}}export{b as createSky,H as updateSky};
