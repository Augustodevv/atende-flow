# AtendeFlow

Aplicação Full-Stack para organizar contatos, oportunidades e próximos passos de pequenos negócios.

## Problema

Conversas comerciais espalhadas em mensagens e anotações tornam fácil esquecer retornos e perder a visão das propostas em andamento. O AtendeFlow reúne essas informações em um painel simples, executado localmente. O uso de IA é opcional e, sem ela, o painel não depende de nenhum serviço externo.

## Funcionalidades

- Cadastro, consulta, edição e exclusão de oportunidades.
- Busca por nome, empresa ou serviço.
- Filtro por etapa da negociação.
- Próxima ação e data de acompanhamento.
- Indicadores de contatos, valor em aberto e negócios fechados.
- Validação de campos no servidor e mensagens de erro na interface.
- Interface responsiva e formulários acessíveis.
- Persistência local em SQLite.
- **Sugestão de próximo passo**: botão "Sugerir" em cada oportunidade, com IA (opcional) ou regras locais.

## Tecnologias

- HTML5, CSS e JavaScript.
- Node.js 24 com servidor HTTP nativo.
- SQLite por meio do módulo `node:sqlite`.
- Node Test Runner para testes automatizados.

O projeto não depende de pacotes de terceiros.

## Sugestão de próximo passo com IA (opcional)

O botão **Sugerir** mostra uma orientação curta para cada oportunidade.

- **Sem configuração:** usa regras locais, como prazo vencido, etapa da negociação e proposta sem resposta.
- **Com `ANTHROPIC_API_KEY`:** envia os dados de negócio à API da Anthropic (modelo `claude-haiku-5-5` por padrão) e mostra a resposta. Se a chamada falhar, o painel volta para as regras locais.

```bash
ANTHROPIC_API_KEY=sua-chave npm start
```

A chave fica só na variável de ambiente e nunca vai para o código. Para a IA, são enviados apenas serviço, etapa, valor, próxima ação e data. **Nome, empresa e e-mail do contato não são enviados.** A resposta é limitada a 400 caracteres e exibida como texto simples.

## Como executar

Requisito: Node.js 24 ou superior.

```bash
npm start
```

Abra `http://localhost:3000`. Na primeira execução, o aplicativo cria dados fictícios para demonstrar o fluxo. A base local fica em `data/atendeflow.sqlite` e não deve ser enviada ao GitHub.

## Testes

```bash
npm test
```

Os testes da sugestão usam uma função `fetch` simulada, sem rede e sem chave.

## Fluxo de demonstração

1. Observe os indicadores do painel.
2. Cadastre uma oportunidade com serviço, valor e próximo passo.
3. Filtre por etapa e edite o registro.
4. Marque a oportunidade como fechada e confira a atualização dos indicadores.

## Estado do projeto

Projeto funcional de estudo e portfólio. Os contatos incluídos inicialmente são dados fictícios e servem apenas para demonstração local.


