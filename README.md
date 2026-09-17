# ⚔️ Warhammer 40,000: Wrath & Glory — Virtual Tabletop (VTT) & Campaign Manager

Plataforma completa de Mesa Virtual (VTT) e Gerenciador de Campanhas/Fichas desenvolvida especificamente para o sistema de RPG **Warhammer 40,000: Wrath & Glory (2ª Edição - Cubicle 7)**.

Projetada com estética *grimdark*, industrial e gótica imperial, suporte a tempo real via **WebSockets (Socket.io)**, banco de dados relacional **SQLite nativo** e arquitetura desacoplada pronta para deploy na **Vercel** (Front-end) e **Render / Railway** (Back-end).

---

## 🏛️ Visão Geral da Arquitetura de Deploy

Devido à natureza *Stateless* e *Serverless* da Vercel (que não mantém conexões persistentes de WebSockets nem armazena arquivos locais do SQLite), a arquitetura de produção é dividida em duas camadas complementares:

```
                  ┌────────────────────────────────────────┐
                  │          Vercel (Front-end)            │
                  │   React 18 + Vite + Tailwind CSS SPA   │
                  │        HTTPS CDN Global & Cache        │
                  └──────────────────┬─────────────────────┘
                                     │
                 REST API Requests   │  WebSockets (Socket.io)
                 (x-user-token Auth) │  (Tempo Real & Whispers)
                                     │
                  ┌──────────────────▼─────────────────────┐
                  │      Render / Railway (Back-end)       │
                  │   Node.js 22+ / Express Web Service    │
                  │   Socket.io Engine + node:sqlite DB    │
                  └──────────────────┬─────────────────────┘
                                     │
                                     ▼
                          [ SQLite Relacional ]
                      (wrath_and_glory.db ou Disco)
```

1. **Front-end (Vercel):** Compilado como Single Page Application (SPA). Utiliza `VITE_API_URL` para apontar ao backend em produção e `vercel.json` para garantir roteamento limpo sem erros 404.
2. **Back-end (Render / Railway / VPS):** Executado como serviço contínuo (Node.js 22+) gerenciando conexões bidirecionais de WebSockets, regras do Dado de Ira, cálculos de Hordas e persistência de dados.

---

## 🚀 Funcionalidades Principais

- **Autenticação Híbrida Minimalista:** Login e auto-registro unificados em rota única protegida com criptografia nativa (`node:crypto.scryptSync`).
- **Hub de Campanhas:** Gestão de múltiplas mesas com isolamento estrito de papéis (*Mestre/GM* e *Jogador/Player*).
- **Código de Convite Dinâmico:** Mestres geram códigos legíveis únicos (ex: `WG-7K9A2X`) para os jogadores ingressarem na saga.
- **Motor do Dado de Ira (Wrath Die):**
  - Rolagem do d6 de cor destacada.
  - Resultado `6`: **Crítico de Ira** (+1 Glória para a mesa e efeitos visuais).
  - Resultado `1`: **Complicação** (+1 Ruína adicionada à reserva oculta do Mestre).
- **Isolamento Rigoroso de Ruína:** O pool de Ruína é estritamente ocultado dos jogadores tanto no front-end quanto nas respostas da API e nos eventos do Socket.
- **Combate de Hordas (Mobs):** Automação oficial de tropas com dados de bônus ($\lfloor N/2 \rfloor$) e baixa de combatentes.
- **Chat em Tempo Real & Sussurros Privados:** Comunicação geral da mesa e canal confidencial direto entre Mestre e Jogadores específicos.
- **Gerador de Fichas de Personagem:** Alocação de Atributos, Perícias, Habilidades, Equipamentos e cálculo automático de Derivados (Defesa, Resiliência, Ferimentos, Choque).

---

## 💻 Instalação e Execução Local

### Pré-requisitos
- **Node.js**: Versão `22.5.0` ou superior (o projeto utiliza o módulo nativo `node:sqlite`).
- **NPM**: Versão 10+.

### 1. Clonar o Repositório
```bash
git clone https://github.com/SEU-USUARIO/warhammer-wg-vtt.git
cd warhammer-wg-vtt
```

### 2. Instalação das Dependências
Instale as dependências da raiz, do servidor e do cliente:
```bash
npm run install:all
```
*(Ou instale manualmente em cada pasta: `cd server && npm install && cd ../client && npm install`)*

### 3. Execução em Desenvolvimento
Você pode rodar ambos os serviços simultaneamente em terminais separados:

**Terminal 1 (Back-end - Porta 3001):**
```bash
cd server
npm run dev
```

**Terminal 2 (Front-end - Porta 5173):**
```bash
cd client
npm run dev
```

No Windows, você também pode simplesmente dar um duplo clique no arquivo [`start.bat`](start.bat).

Acesse: **`http://localhost:5173`**

---

## ⚙️ Variáveis de Ambiente

### Front-end (`client/.env`)
| Variável | Descrição | Exemplo em Produção |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL base do servidor back-end | `https://warhammer-vtt-backend.onrender.com` |
| `VITE_SOCKET_URL` | URL do servidor Socket.io (opcional) | `https://warhammer-vtt-backend.onrender.com` |

> Em desenvolvimento local, deixe `VITE_API_URL` em branco para que o Vite utilize o proxy configurado para `http://127.0.0.1:3001`.

### Back-end (`server/.env`)
| Variável | Descrição | Padrão |
| :--- | :--- | :--- |
| `PORT` | Porta do servidor HTTP | `3001` (Render define automaticamente) |
| `CLIENT_ORIGIN` | Origens autorizadas para CORS (separadas por vírgula) | `*` ou `https://seu-vtt.vercel.app` |
| `DATA_DIR` | Diretório de armazenamento do banco SQLite | `./data` (ou `/var/data` para volume persistente) |
| `NODE_VERSION` | Versão do Node.js | `22` |

---

## 🌐 Guia de Deploy em Produção

### Passo 1: Deploy do Back-end no Render (Gratuito)

1. Crie uma conta no [Render.com](https://render.com).
2. Clique em **New +** > **Web Service**.
3. Conecte seu repositório do GitHub recém-criado.
4. Configure os parâmetros:
   - **Name:** `warhammer-vtt-backend`
   - **Region:** Escolha a mais próxima (ex: *Frankfurt* ou *Ohio*)
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Plan:** `Free`
5. Na aba **Environment Variables**, adicione:
   - `NODE_VERSION` = `22`
   - `CLIENT_ORIGIN` = `*` (ou a URL da sua Vercel após o deploy do front)
6. Clique em **Deploy Web Service**.
7. Copie a URL pública gerada pelo Render (ex: `https://warhammer-vtt-backend.onrender.com`).

*(Opcional: O arquivo [`render.yaml`](render.yaml) na raiz permite provisionamento automático como Blueprint).*

---

### Passo 2: Deploy do Front-end na Vercel

1. Crie uma conta ou faça login na [Vercel](https://vercel.com).
2. Clique em **Add New...** > **Project** e importe o repositório do GitHub.
3. Configure o projeto:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client` (clique em *Edit* e selecione a pasta `client`)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Na seção **Environment Variables**, configure:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://warhammer-vtt-backend.onrender.com` (a URL do seu Render criada no Passo 1)
   - **Key:** `VITE_SOCKET_URL`
   - **Value:** `https://warhammer-vtt-backend.onrender.com`
5. Clique em **Deploy**.

---

## 🖥️ Comandos de Terminal (Ambiente Linux / Ubuntu)

Abaixo está a sequência exata de comandos para você inicializar o Git, criar o primeiro commit, conectar ao seu repositório no GitHub e fazer o push:

### 1. Configurar e Inicializar o Git
```bash
# Certifique-se de estar na raiz do projeto
cd traduzirwarhammer

# Inicialize o repositório local
git init

# Configure o ramo principal como 'main'
git branch -M main

# Verifique os arquivos que serão adicionados (o .gitignore protegerá node_modules e banco)
git status
```

### 2. Criar o Primeiro Commit
```bash
# Adicione todos os arquivos versionáveis
git add .

# Crie o commit inaugural
git commit -m "feat: initial commit - Warhammer 40k Wrath & Glory VTT (Full-Stack)"
```

### 3. Conectar ao GitHub e Fazer o Push
> Substitua `SEU_USUARIO` e `SEU_REPOSITORIO` pelos dados do seu repositório criado no GitHub.

```bash
# Adicione o link do repositório remoto
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# Envie os arquivos para a branch main
git push -u origin main
```

### 4. Deploy Direto via Vercel CLI (Alternativa ao Dashboard)
Se preferir publicar diretamente pela linha de comando no Ubuntu:

```bash
# Instale a CLI global da Vercel (se ainda não tiver)
sudo npm install -g vercel

# Navegue até a pasta do cliente
cd client

# Faça login na Vercel
vercel login

# Faça o deploy para preview
vercel

# Para deploy oficial em produção com as variáveis de ambiente:
vercel --prod -e VITE_API_URL="https://seu-backend.onrender.com" -e VITE_SOCKET_URL="https://seu-backend.onrender.com"
```

---

## 📜 Licença e Créditos

- **Regras e Ambientação:** *Warhammer 40,000: Wrath & Glory* © Games Workshop Ltd. / Cubicle 7 Entertainment.
- **Desenvolvimento:** Sistema criado sob medida para Mestres e Jogadores executarem sessões imersivas online ou em rede local.
