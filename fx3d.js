/* 3D effects: Three.js party scene (gifts, balloons, rings, stars, confetti) + CSS 3D tilt cards.
   Everything degrades gracefully if WebGL or the CDN is unavailable. */
const FX = (() => {
  // `reduce` is true when animation is off (OS setting or the in-page Motion toggle) and is updated by setMotion().
  let reduce =
    !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ||
    document.documentElement.classList.contains('calm');

  /* ---------- 3D tilt with glare on [data-tilt] elements ---------- */
  function initTilt() {
    let cur = null;
    const reset = el => {
      el.classList.remove('tilting');
      el.style.transform = '';
    };
    document.addEventListener(
      'pointermove',
      e => {
        if (e.pointerType === 'touch' || reduce) return;
        const el = e.target && e.target.closest ? e.target.closest('[data-tilt]') : null;
        if (cur && cur !== el) reset(cur);
        cur = el;
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const px = (e.clientX - r.left) / r.width,
          py = (e.clientY - r.top) / r.height;
        const max = +el.dataset.tilt || 7;
        el.classList.add('tilting');
        el.style.transform = `perspective(900px) rotateX(${((0.5 - py) * max * 2).toFixed(2)}deg) rotateY(${((px - 0.5) * max * 2).toFixed(2)}deg) translateZ(8px)`;
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      },
      { passive: true }
    );
    document.addEventListener(
      'pointerleave',
      () => {
        if (cur) {
          reset(cur);
          cur = null;
        }
      },
      true
    );
    window.addEventListener('blur', () => {
      if (cur) {
        reset(cur);
        cur = null;
      }
    });
  }
  const markTilt = (root = document, sel = '.stat,.v-card,.feat,.type span,.donut,.gcard,.fact,.stat3') =>
    root.querySelectorAll(sel).forEach(el => {
      if (!el.hasAttribute('data-tilt')) el.setAttribute('data-tilt', '');
    });

  /* ---------- Three.js scene ---------- */
  const stub = { ready: false, setColors() {}, setMood() {}, burst() {}, setMotion() {} };
  function createScene() {
    const canvas = document.getElementById('scene3d');
    if (!canvas || typeof THREE === 'undefined') return stub;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (e) {
      canvas.style.display = 'none';
      return stub;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0, 13);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(5, 8, 8);
    scene.add(key);
    const glow = new THREE.PointLight(0xff6b9d, 0.9, 45);
    glow.position.set(-6, -3, 6);
    scene.add(glow);

    const palette = [0xff6b9d, 0xffb347, 0x7c5cff, 0x3ddc97];
    const mats = palette.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.25 }));
    const gold = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.25, metalness: 0.8 });
    const stringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });

    const G = {
      box: new THREE.BoxGeometry(1.2, 1, 1.2),
      ribV: new THREE.BoxGeometry(0.22, 1.02, 1.22),
      ribH: new THREE.BoxGeometry(1.22, 1.02, 0.22),
      bow: new THREE.TorusGeometry(0.2, 0.07, 8, 16),
      ball: new THREE.SphereGeometry(0.6, 24, 18),
      knot: new THREE.ConeGeometry(0.1, 0.2, 8),
      str: new THREE.CylinderGeometry(0.012, 0.012, 1.5, 4),
      ring: new THREE.TorusGeometry(0.55, 0.09, 16, 40),
      star: new THREE.OctahedronGeometry(0.5, 0),
    };
    const makers = {
      gift: m => {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(G.box, m), new THREE.Mesh(G.ribV, gold), new THREE.Mesh(G.ribH, gold));
        const b = new THREE.Mesh(G.bow, gold);
        b.position.y = 0.62;
        b.rotation.x = Math.PI / 2;
        g.add(b);
        return g;
      },
      balloon: m => {
        const g = new THREE.Group();
        const b = new THREE.Mesh(G.ball, m);
        b.scale.set(1, 1.25, 1);
        const k = new THREE.Mesh(G.knot, m);
        k.position.y = -0.82;
        k.rotation.z = Math.PI;
        const s = new THREE.Mesh(G.str, stringMat);
        s.position.y = -1.6;
        g.add(b, k, s);
        return g;
      },
      ring: () => {
        const g = new THREE.Group();
        const a = new THREE.Mesh(G.ring, gold);
        const b = new THREE.Mesh(G.ring, gold);
        b.position.x = 0.5;
        b.rotation.y = Math.PI / 2;
        g.add(a, b);
        g.position.x -= 0.25;
        return g;
      },
      star: m => new THREE.Mesh(G.star, m),
    };

    const MOOD = {
      wedding: { ring: 1, star: 0.8, gift: 0.5, balloon: 0.4 },
      birthday: { balloon: 1, gift: 1, star: 0.5, ring: 0.05 },
      community: { star: 1, balloon: 0.8, gift: 0.6, ring: 0.15 },
    };
    const small = window.innerWidth < 700;
    const plan = small ? { gift: 3, balloon: 4, ring: 2, star: 4 } : { gift: 5, balloon: 7, ring: 3, star: 7 };
    const world = new THREE.Group();
    scene.add(world);
    const items = [];
    let n = 0;
    for (const kind of Object.keys(plan)) {
      for (let i = 0; i < plan[kind]; i++, n++) {
        const o = makers[kind](mats[n % mats.length]);
        const x = (Math.random() * 2 - 1) * 11,
          y = (Math.random() * 2 - 1) * 6.5,
          z = -8 + Math.random() * 11;
        const size = kind === 'balloon' ? 1 : kind === 'star' ? 0.9 + Math.random() * 0.5 : 1;
        o.position.set(x, y, z);
        o.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        o.scale.setScalar(0.001);
        o.userData = {
          kind,
          by: y,
          ph: Math.random() * 6.28,
          fs: 0.4 + Math.random() * 0.5,
          rx: (Math.random() - 0.5) * 1.2,
          ry: (Math.random() - 0.5) * 1.6,
          size,
          u: Math.random(),
          target: 1,
        };
        if (kind === 'balloon') {
          o.userData.rx *= 0.1;
        }
        world.add(o);
        items.push(o);
      }
    }

    // confetti dust
    const pc = small ? 120 : 260,
      pos = new Float32Array(pc * 3);
    for (let i = 0; i < pc; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 16;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * 9;
      pos[i * 3 + 2] = -10 + Math.random() * 14;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(
      pg,
      new THREE.PointsMaterial({ size: 0.07, color: 0xffffff, transparent: true, opacity: 0.65 })
    );
    world.add(dust);

    let spin = 1,
      mx = 0,
      my = 0,
      tx = 0,
      ty = 0,
      running = true,
      raf = 0,
      mood = 'wedding';
    const t0 = performance.now();

    const wanted = u => (u.u < (MOOD[mood][u.kind] ?? 0.5) ? 1 : 0);
    function applyMood(type) {
      mood = MOOD[type] ? type : 'wedding';
      items.forEach(o => {
        const u = o.userData;
        if (!u.respawn && !u.popAt) u.target = wanted(u);
      });
    }
    // click a floating balloon to pop it; it respawns a few seconds later
    const ray = new THREE.Raycaster();
    function pop(cx, cy) {
      if (reduce) return false;
      ray.setFromCamera({ x: (cx / window.innerWidth) * 2 - 1, y: -((cy / window.innerHeight) * 2 - 1) }, camera);
      const pool = items.filter(
        o => o.userData.kind === 'balloon' && o.visible && o.userData.target > 0 && !o.userData.popAt
      );
      const hit = ray.intersectObjects(pool, true)[0];
      if (!hit) return false;
      let o = hit.object;
      while (o.parent && o.parent !== world) o = o.parent;
      const u = o.userData;
      u.popAt = performance.now();
      u.target = 1.7;
      u.fast = true;
      spin = 6;
      return true;
    }
    function resize() {
      const w = window.innerWidth,
        h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    function draw(now) {
      const t = (now - t0) / 1000,
        sy = window.scrollY || 0;
      spin += (1 - spin) * 0.03;
      for (const o of items) {
        const u = o.userData;
        if (u.popAt && now - u.popAt > 110) {
          u.popAt = 0;
          u.target = 0;
          u.respawn = now + 5000;
        }
        if (u.respawn && now > u.respawn) {
          u.respawn = 0;
          u.fast = false;
          u.by = (Math.random() * 2 - 1) * 6.5;
          o.position.x = (Math.random() * 2 - 1) * 11;
          u.target = wanted(u);
        }
        o.position.y = u.by + Math.sin(t * u.fs + u.ph) * 0.5;
        o.rotation.x += u.rx * spin * 0.01;
        o.rotation.y += u.ry * spin * 0.01;
        const goal = u.target * u.size,
          s = o.scale.x,
          ns = s + (goal - s) * (u.fast ? 0.4 : 0.06);
        o.scale.setScalar(Math.max(ns, 0.001));
        o.visible = ns > 0.03;
      }
      dust.rotation.y = t * 0.02 * spin;
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
      camera.position.x = mx * 1.6;
      camera.position.y = -my * 1.1 - sy * 0.002;
      camera.lookAt(0, -sy * 0.002, 0);
      world.rotation.y = sy * 0.0004 + mx * 0.05;
      renderer.render(scene, camera);
    }
    function loop(now) {
      if (!running) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    }

    resize();
    applyMood('wedding');
    window.addEventListener('resize', () => {
      resize();
      if (reduce || !running) draw(performance.now());
    });
    window.addEventListener(
      'pointermove',
      e => {
        tx = (e.clientX / window.innerWidth - 0.5) * 2;
        ty = (e.clientY / window.innerHeight - 0.5) * 2;
      },
      { passive: true }
    );
    document.addEventListener('visibilitychange', () => {
      if (reduce) return;
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(loop);
      else cancelAnimationFrame(raf);
    });
    if (reduce) {
      running = false;
      items.forEach(o => o.scale.setScalar(o.userData.target * o.userData.size || 0.001));
      draw(performance.now());
    } else raf = requestAnimationFrame(loop);

    document.addEventListener('click', e => {
      if (
        e.target.closest &&
        e.target.closest('a,button,input,select,textarea,label,summary,details,.card,.dash,.chat,.nav,.loader')
      )
        return;
      if (pop(e.clientX, e.clientY) && FX.onPop) FX.onPop();
    });

    return {
      ready: true,
      setColors(list) {
        if (!list || !list.length) return;
        mats.forEach((m, i) => m.color.set(list[i % list.length]));
        glow.color.set(list[0]);
        if (reduce) draw(performance.now());
      },
      setMood(type) {
        applyMood(type);
        if (reduce) {
          items.forEach(o => o.scale.setScalar(Math.max(o.userData.target * o.userData.size, 0.001)));
          draw(performance.now());
        }
      },
      burst() {
        spin = 9;
      },
      /** Pauses (false) or resumes (true) the animation loop; paused mode draws one static frame. */
      setMotion(on) {
        reduce = !on;
        if (reduce) {
          cancelAnimationFrame(raf);
          running = false;
          items.forEach(o => o.scale.setScalar(Math.max(o.userData.target * o.userData.size, 0.001)));
          draw(performance.now());
        } else if (!running && !document.hidden) {
          running = true;
          raf = requestAnimationFrame(loop);
        }
      },
    };
  }

  let scene = stub;
  function init() {
    initTilt();
    try {
      scene = createScene();
    } catch (e) {
      scene = stub;
      const c = document.getElementById('scene3d');
      if (c) c.style.display = 'none';
    }
    FX.scene = scene;
  }
  const api = {
    init,
    markTilt,
    scene: stub,
    onPop: null,
    setMotion(on) {
      reduce = !on;
      FX.scene.setMotion(on);
    },
  };
  return api;
})();
