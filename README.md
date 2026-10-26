# CRM Fermani Embalagens

App comercial da Fermani: pendências do dia, carteira, registro de contatos, busca antes de prospectar e resultados.

- **web/**: o app (HTML, CSS e JavaScript, sem etapa de build). Publicado pelo GitHub Pages.
- **supabase/schema.sql**: estrutura do banco e regras de acesso. Cada vendedor vê só a própria carteira; o gestor vê tudo.

Nenhum dado de cliente fica neste repositório. Os dados ficam no Supabase e entram pelo botão **Equipe → Importar dados**, usado só pelo gestor.

## Configuração

1. No Supabase, abra o **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
2. Em **Authentication → Sign In / Providers → Email**, desligue **Confirm email**.
3. Coloque a Project URL e a chave anon/publishable em `web/config.js`.
