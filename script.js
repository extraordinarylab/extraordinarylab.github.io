const stage = document.getElementById('carousel-stage');
const cards = [...document.querySelectorAll('.research-card')];
const activePaper = document.getElementById('active-paper');
const previousButton = document.getElementById('prev-paper');
const nextButton = document.getElementById('next-paper');

if (stage && cards.length) {
  const count = cards.length;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let angle = 0;
  let targetAngle = 0;
  let lastTime = performance.now();
  let paused = false;
  let pointerStartX = null;
  let dragDelta = 0;

  const spacing = (Math.PI * 2) / count;
  const autoSpeed = reduceMotion ? 0 : 0.000075;

  const lerp = (a, b, amount) => a + (b - a) * amount;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function radius() {
    return window.innerWidth <= 720 ? 150 : 285;
  }

  function frontIndex() {
    let bestIndex = 0;
    let bestDepth = -Infinity;

    cards.forEach((_, i) => {
      const cardAngle = angle + i * spacing;
      const depth = Math.cos(cardAngle);
      if (depth > bestDepth) {
        bestDepth = depth;
        bestIndex = i;
      }
    });

    return bestIndex;
  }

  function render() {
    const r = radius();

    cards.forEach((card, i) => {
      const cardAngle = angle + i * spacing;
      const x = Math.sin(cardAngle) * r;
      const z = Math.cos(cardAngle);
      const normalizedZ = (z + 1) / 2;
      const scale = lerp(0.64, 1, normalizedZ);
      const opacity = lerp(0.22, 1, normalizedZ);
      const y = lerp(18, 0, normalizedZ);

      card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = String(Math.round(normalizedZ * 100));
      card.style.pointerEvents = normalizedZ > 0.73 ? 'auto' : 'none';
      card.setAttribute('aria-hidden', normalizedZ > 0.73 ? 'false' : 'true');
    });

    if (activePaper) {
      activePaper.textContent = String(frontIndex() + 1).padStart(2, '0');
    }
  }

  function moveBy(direction) {
    targetAngle += direction * spacing;
    paused = true;
    window.clearTimeout(moveBy.resumeTimer);
    moveBy.resumeTimer = window.setTimeout(() => {
      paused = false;
    }, 1800);
  }

  function animate(now) {
    const delta = clamp(now - lastTime, 0, 40);
    lastTime = now;

    if (!paused && pointerStartX === null) {
      targetAngle += autoSpeed * delta;
    }

    angle += (targetAngle - angle) * (reduceMotion ? 1 : 0.075);
    render();
    requestAnimationFrame(animate);
  }

  previousButton?.addEventListener('click', () => moveBy(1));
  nextButton?.addEventListener('click', () => moveBy(-1));

  stage.addEventListener('mouseenter', () => { paused = true; });
  stage.addEventListener('mouseleave', () => {
    if (pointerStartX === null) paused = false;
  });

  stage.addEventListener('pointerdown', (event) => {
    pointerStartX = event.clientX;
    dragDelta = 0;
    paused = true;
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener('pointermove', (event) => {
    if (pointerStartX === null) return;
    const nextDelta = event.clientX - pointerStartX;
    const movement = nextDelta - dragDelta;
    dragDelta = nextDelta;
    targetAngle += movement * 0.004;
  });

  stage.addEventListener('pointerup', (event) => {
    pointerStartX = null;
    dragDelta = 0;
    stage.releasePointerCapture?.(event.pointerId);
    window.setTimeout(() => { paused = false; }, 900);
  });

  stage.addEventListener('pointercancel', () => {
    pointerStartX = null;
    dragDelta = 0;
    paused = false;
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') moveBy(1);
    if (event.key === 'ArrowRight') moveBy(-1);
  });

  render();
  requestAnimationFrame(animate);
}
