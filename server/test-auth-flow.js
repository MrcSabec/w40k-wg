const http = require('http');

async function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch(e) { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== INICIANDO TESTE DO SISTEMA DE AUTENTICAÇÃO HÍBRIDA & ROLES ===\n');

  // Test 1: Auto-register GM
  console.log('1. Auto-registro do Mestre (GM)...');
  const gmAuth = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/users/auth',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'Mestre_Test', password: 'password123' });

  console.log('Status:', gmAuth.status, '| Novo usuário?', gmAuth.body.isNew);
  if (gmAuth.status !== 201 && gmAuth.status !== 200) {
    throw new Error('Falha no auto-registro do Mestre: ' + JSON.stringify(gmAuth.body));
  }
  const gmToken = gmAuth.body.token;
  console.log('Token do Mestre obtido com sucesso!');

  // Test 2: Auto-register Player 1
  console.log('\n2. Auto-registro do Jogador_1...');
  const p1Auth = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/users/auth',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'Jogador_1_Test', password: 'playerpass123' });

  console.log('Status:', p1Auth.status, '| Novo usuário?', p1Auth.body.isNew);
  if (p1Auth.status !== 201 && p1Auth.status !== 200) {
    throw new Error('Falha no auto-registro do Jogador_1: ' + JSON.stringify(p1Auth.body));
  }
  const p1Token = p1Auth.body.token;

  // Test 3: Attempt login with WRONG password for Jogador_1
  console.log('\n3. Tentativa de login com SENHA INCORRETA para Jogador_1...');
  const wrongPass = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/users/auth',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'Jogador_1_Test', password: 'SENHA_ERRADA' });

  console.log('Status:', wrongPass.status, '| Mensagem de erro:', wrongPass.body.error);
  if (wrongPass.status !== 401) {
    throw new Error('Esperava status 401 para senha incorreta, recebeu ' + wrongPass.status);
  }
  console.log('✓ Bloqueio por senha incorreta funcionando rigorosamente!');

  // Test 4: Login with CORRECT password for Jogador_1
  console.log('\n4. Login com SENHA CORRETA para Jogador_1...');
  const correctPass = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/users/auth',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'Jogador_1_Test', password: 'playerpass123' });

  console.log('Status:', correctPass.status, '| Mensagem:', correctPass.body.message);
  if (correctPass.status !== 200 || correctPass.body.isNew !== false) {
    throw new Error('Falha no login com senha correta');
  }
  console.log('✓ Login com senha correta bem-sucedido!');

  // Test 5: Verify Session /me for Jogador_1
  console.log('\n5. Verificando sessão em /api/users/me com token...');
  const meRes = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/users/me',
    method: 'GET',
    headers: { 'x-user-token': p1Token }
  });
  console.log('Status:', meRes.status, '| Identidade validada:', meRes.body.username);
  if (meRes.status !== 200 || meRes.body.id !== p1Auth.body.id) {
    throw new Error('Falha na rota /me');
  }

  // Test 6: Mestre creates a campaign
  console.log('\n6. Mestre cria uma nova campanha...');
  const createCampRes = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/campaigns',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-token': gmToken
    }
  }, {
    name: 'Cruzada de Teste Automatizado',
    tier: 2,
    framework: 'Inquisição Imperial',
    description: 'Campanha de validação de permissões simultâneas.'
  });

  console.log('Status:', createCampRes.status, '| Campanha:', createCampRes.body.name);
  console.log('Role do criador:', createCampRes.body.role, '| Código de convite:', createCampRes.body.invite_code);
  if (createCampRes.body.role !== 'gm' || !createCampRes.body.invite_code) {
    throw new Error('Mestre não recebeu role gm ou código de convite');
  }
  const inviteCode = createCampRes.body.invite_code;
  const campaignId = createCampRes.body.id;

  // Test 7: Jogador_1 enters campaign via invite code
  console.log('\n7. Jogador_1 entra na campanha usando o código de convite', inviteCode, '...');
  const joinRes = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/campaigns/join',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-token': p1Token
    }
  }, { invite_code: inviteCode });

  console.log('Status:', joinRes.status, '| Role atribuído ao Jogador:', joinRes.body.role);
  if (joinRes.body.role !== 'player') {
    throw new Error('Jogador não recebeu role player');
  }

  // Test 8: Verify Role Isolation (Ruin visibility)
  console.log('\n8. Testando isolamento de Ruína (GM vs Player)...');
  const gmCampView = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: `/api/campaigns/${campaignId}`,
    method: 'GET',
    headers: { 'x-user-token': gmToken }
  });
  const playerCampView = await request({
    hostname: '127.0.0.1',
    port: 3001,
    path: `/api/campaigns/${campaignId}`,
    method: 'GET',
    headers: { 'x-user-token': p1Token }
  });

  const gmSeesRuin = gmCampView.body.ruin !== null && gmCampView.body.ruin !== undefined;
  const playerSeesRuin = playerCampView.body.ruin !== null && playerCampView.body.ruin !== undefined;

  console.log('Mestre enxerga Ruína?:', gmSeesRuin ? `SIM (Ruin = ${gmCampView.body.ruin})` : 'NÃO');
  console.log('Jogador enxerga Ruína?:', playerSeesRuin ? `SIM (ERRO!)` : 'NÃO (CORRETO - Ruína ocultada do Jogador!)');
  console.log('Mestre enxerga Glória?:', gmCampView.body.glory !== null ? `SIM (Glory = ${gmCampView.body.glory})` : 'NÃO');
  console.log('Jogador enxerga Glória?:', playerCampView.body.glory !== null ? `SIM (Glory = ${playerCampView.body.glory})` : 'NÃO');

  if (!gmSeesRuin || playerSeesRuin) {
    throw new Error('Falha no isolamento de Ruína entre GM e Player!');
  }

  console.log('\n=============================================================');
  console.log('🎉 TODOS OS TESTES DE AUTENTICAÇÃO E PERMISSÕES FORAM APROVADOS COM SUCESSO!');
  console.log('=============================================================');
}

runTests().catch(err => {
  console.error('❌ ERRO NO TESTE:', err);
  process.exit(1);
});
