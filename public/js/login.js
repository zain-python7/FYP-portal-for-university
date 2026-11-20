const f = document.getElementById('f'), err = document.getElementById('err'), btn = document.getElementById('btn');
f.addEventListener('submit', async e => {
  e.preventDefault();
  err.textContent = '';
  btn.disabled = true; btn.textContent = 'Signing in...';
  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('email').value, password: document.getElementById('pw').value }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    location.href = '/dashboard.html';
  } catch (ex) {
    err.textContent = ex.message || 'Could not reach the server. Check your connection.';
    btn.disabled = false; btn.textContent = 'Sign in';
  }
});
