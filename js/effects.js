let rafId = null;

export function handleMouseMove(e) {
    const card = e.currentTarget;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const distX = Math.abs(x - centerX);
        const distY = Math.abs(y - centerY);
        card.style.boxShadow = (distX < 50 && distY < 50) ? '0 20px 40px rgba(0, 219, 233, 0.2)' : '0 10px 20px rgba(0, 0, 0, 0.5)';
    });
}

export function handleMouseLeave(e) {
    if (rafId) cancelAnimationFrame(rafId);
    e.currentTarget.style.boxShadow = 'none';
}