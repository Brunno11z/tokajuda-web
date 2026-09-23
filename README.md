# TokAjuda

Site estático responsivo para comunidade de compartilhamento de links, preparado para **GitHub Pages + Supabase**.

## O que já vem pronto

- Página inicial responsiva.
- Visual escuro com paleta ciano/rosa.
- Botão para acesso ao TikTok Lite.
- Formulário com nome, link e upload de print.
- Status inicial `pending`.
- Mural exibindo somente links aprovados.
- Contador simples de acessos aos links.
- Painel `/admin.html`.
- Login de administrador pelo Supabase Auth.
- Aprovar, recusar e excluir solicitações.
- Visualização privada do print por URL assinada.
- Regras RLS no banco e no Storage.

## 1. Criar o Supabase

1. Crie um projeto no Supabase.
2. Abra **SQL Editor**.
3. Cole e execute todo o conteúdo de `supabase.sql`.
4. Vá em **Authentication > Users** e crie seu usuário administrador.
5. Copie o UUID do usuário.
6. No SQL Editor execute:

```sql
insert into public.admins (user_id)
values ('COLE-O-UUID-DO-ADMIN-AQUI');
```

## 2. Configurar o site

Abra `config.js` e substitua:

```js
supabaseUrl: "COLE_SUA_SUPABASE_URL_AQUI",
supabaseAnonKey: "COLE_SUA_SUPABASE_ANON_KEY_AQUI",
```

Pelos dados de **Project Settings > API** do seu projeto Supabase.

Também altere:

```js
downloadUrl: "https://www.tiktok.com/download",
```

para o link oficial/permitido que você deseja usar.

> A `anon key` do Supabase é feita para ser usada no frontend. A segurança real está nas políticas RLS. Nunca coloque `service_role` no GitHub.

## 3. Publicar no GitHub Pages

Crie um repositório no GitHub, por exemplo:

`tokajuda`

Envie estes arquivos para a raiz do repositório.

Depois:

1. Abra **Settings** do repositório.
2. Entre em **Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Branch: `main`.
5. Pasta: `/ (root)`.
6. Salve.

Seu endereço ficará parecido com:

`https://SEU-USUARIO.github.io/tokajuda/`

## 4. Acessar o painel

Abra:

`https://SEU-USUARIO.github.io/tokajuda/admin.html`

Use o e-mail e senha do administrador criado no Supabase.

## Observações importantes

- GitHub Pages só hospeda frontend estático; o Supabase fornece banco, autenticação e armazenamento.
- O site inclui aviso de que é uma comunidade independente e não afiliada ao TikTok.
- A participação de visitantes no mural deve ser voluntária.
- Não publique prints com dados pessoais ou sensíveis.
- Se você mudar as regras de indicação/recompensa, confira se continuam compatíveis com os termos da plataforma utilizada.
