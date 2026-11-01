/* Ghost World, Stage 2: Gentle Phantom + atmosphere. Plain script, needs THREE (r128).
   Usage: const world = GhostWorld.create(THREE, scene);  world.update(t, {x,y}, scrollProgress, reduced) */
(function (global) {
  const NOISE = `
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){return .5*n(p)+.25*n(p*2.03)+.125*n(p*4.01);}`;

  /* The phantom: stacked translucent veil sheets. One tapering silhouette, no arms, no hands,
     no face. The head is a plain rounded cap; the body widens smoothly and dissolves into mist. */
  const PH_VERT = `uniform float t,phase,speed;varying vec2 vUv;
    void main(){vUv=uv;vec3 p=position;float low=1.-uv.y;
      p.x+=sin(uv.y*4.+t*speed+phase)*.18*low*low;
      p.z+=cos(uv.y*3.+t*speed*.8+phase)*.25*low;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
  const PH_FRAG = `${NOISE}
    uniform float t,phase,speed,alpha,widen,breath;uniform vec3 tint;varying vec2 vUv;
    void main(){
      float d=clamp((.84-vUv.y)/.84,0.,1.);            // 0 at head, 1 at the mist
      float hw=.07*sqrt(min(d/.07,1.))+.16*smoothstep(.05,.5,d)+.12*d;   // monotonic: no limbs
      hw*=widen;
      float tt=t*speed;
      hw+=(fbm(vec2(vUv.y*5.-tt*.25,phase))-.5)*.07*d;
      float x=vUv.x-.5+sin(vUv.y*3.+tt*.5+phase)*.02*d;
      float body=1.-smoothstep(hw-.09,hw,abs(x));
      body*=step(vUv.y,.84+.0)*smoothstep(.0,.04,.84-vUv.y+.04); // featureless rounded top
      float streak=fbm(vec2(x*16.,vUv.y*2.-tt*.35+phase));
      float veil=mix(.55,.15+streak*1.1,smoothstep(.1,.7,d));    // solid-ish torso, streaky veils
      float fade=1.-smoothstep(.55,1.,d)*.95;                    // dissolves into fog
      float a=body*veil*fade*alpha*breath;
      vec3 c=mix(tint,vec3(.86,.92,1.),streak*.5+(1.-d)*.25);
      gl_FragColor=vec4(c,a);}`;

  const FOG_VERT = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const FOG_FRAG = `${NOISE}
    uniform float t,speed,alpha,seed;uniform vec3 tint;varying vec2 vUv;
    void main(){vec2 p=vUv*vec2(3.,1.6)+vec2(t*speed,seed);
      float f=fbm(p+fbm(p*1.3+t*speed*.5));
      float band=smoothstep(.0,.55,vUv.y)*(1.-smoothstep(.6,1.,vUv.y)); // hugs the ground
      gl_FragColor=vec4(tint,smoothstep(.3,.85,f)*band*alpha);}`;

  function sheet(THREE, w, hgt, uniforms, vert, frag) {
    const m = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag,
      transparent: true, depthWrite: false, side: THREE.DoubleSide });
    return new THREE.Mesh(new THREE.PlaneGeometry(w, hgt, 24, 48), m);
  }

  function create(THREE, scene) {
    const U = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { value: v }]));
    const phantom = new THREE.Group(), veils = [];
    // 7 layers, each slightly different width, depth, speed and tint => depth without a model file.
    for (let i = 0; i < 7; i++) {
      const k = i / 6;
      const u = U({ t: 0, phase: i * 1.9, speed: .35 + k * .5, alpha: .2 - k * .02, widen: .9 + k * .3,
        breath: 1, tint: new THREE.Color().setHSL(.6 + k * .08, .35, .62 - k * .12) });
      const mesh = sheet(THREE, 9, 12, u, PH_VERT, PH_FRAG);
      mesh.position.z = -1.6 + k * 2.2; mesh.position.x = (k - .5) * .4;
      phantom.add(mesh); veils.push({ u, mesh, k });
    }
    phantom.position.set(1.6, -.6, -2); phantom.scale.setScalar(1.15);  // large, off-centre, bleeds past the edges
    scene.add(phantom);

    const fogs = [];
    for (let i = 0; i < 4; i++) {
      const u = U({ t: 0, speed: .012 + i * .006, alpha: .5 - i * .08, seed: i * 7.3, tint: new THREE.Color(i % 2 ? 0x5a6a9a : 0x8fa2c8) });
      const m = sheet(THREE, 30, 7, u, FOG_VERT, FOG_FRAG);
      m.position.set(0, -3 + i * .25, -4 + i * 2.6); scene.add(m); fogs.push({ u, m, i });
    }

    // soft drifting motes (replaces the old gold embers with cold silver)
    const N = 160, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i*3] = (Math.random() - .5) * 20; pos[i*3+1] = (Math.random() - .5) * 11; pos[i*3+2] = Math.random() * -8 + 2; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const motes = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xcfd9ff, size: .05, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(motes);

    let mx = 0, my = 0;
    function update(t, mouse, scroll, reduced) {
      const s = reduced ? 0 : 1, tt = t * s;
      mx += ((reduced ? 0 : mouse.x) - mx) * .03; my += ((reduced ? 0 : mouse.y) - my) * .03;
      const breath = .8 + .2 * Math.sin(tt * .25);          // fades slowly in and out of the fog
      veils.forEach(({ u, mesh, k }) => {
        u.t.value = tt; u.breath.value = breath;
        mesh.position.x = (k - .5) * .4 + mx * (.3 + k * .5);   // layers parallax at different rates
      });
      fogs.forEach(({ u, m, i }) => { u.t.value = tt; m.position.x = -mx * (.4 + i * .3); });
      phantom.position.y = -.6 + scroll * 1.8 + Math.sin(tt * .3) * .12;   // slow, heavy rise on scroll
      phantom.position.x = 1.6 - scroll * 1.2 + mx * .4;
      phantom.scale.setScalar(1.15 + scroll * .2);
      phantom.rotation.y = mx * .08; phantom.rotation.z = Math.sin(tt * .2) * .015;
      const a = motes.geometry.attributes.position;
      for (let i = 0; i < N; i++) { a.array[i*3+1] += .002 * s; if (a.array[i*3+1] > 5.5) a.array[i*3+1] = -5.5; }
      a.needsUpdate = true;
    }
    return { phantom, update };
  }
  global.GhostWorld = { create };
})(window);
