const http = require('http');

async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hod.btai@invertis.edu.in', password: 'hod123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  const res = await fetch('http://localhost:5000/api/responses/analytics', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('HOD Analytics Status:', res.status);
  const data = await res.json();
  console.log('HOD Analytics Data:', data);
  
  const superLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@invertis.edu.in', password: 'superadmin123' })
  });
  const superLoginData = await superLoginRes.json();
  const superToken = superLoginData.token;

  const res2 = await fetch('http://localhost:5000/api/responses/reveal/ANO-7X92K', {
    headers: { 'Authorization': `Bearer ${superToken}` }
  });
  console.log('SuperAdmin Reveal Status:', res2.status);
  const data2 = await res2.json();
  console.log('SuperAdmin Reveal Data:', data2);
}
test().catch(console.error);
