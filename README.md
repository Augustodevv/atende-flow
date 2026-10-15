# AtendeFlow

Aplicação para organizar oportunidades comerciais de pequenos negócios. O usuário cadastra contatos, acompanha o estágio de cada negociação, define o próximo passo e visualiza indicadores do pipeline.

## O que demonstra

- Interface responsiva com busca, filtro e formulários acessíveis.
- API HTTP em Node.js para criar, consultar, editar e excluir oportunidades.
- Persistência em SQLite e consultas parametrizadas.
- Validação de dados no servidor e tratamento de erros na interface.
- Indicadores de contatos, valor em aberto, negócios fechados e conversão.

O projeto usa **Node.js 24 ou superior**. Não requer instalação de pacotes nem conexão com serviços externos.

## Executar

```bash
npm start
```

Abra `http://localhost:3000`. Na primeira execução, o aplicativo inclui quatro contatos fictícios para demonstração. Os dados ficam no arquivo `data/atendeflow.sqlite`; a pasta `data/` não deve ser enviada ao GitHub.

Para testar:

```bash
npm test
```

## Fluxo para apresentar em entrevista

1. Mostre os indicadores do painel e explique o problema: perder o acompanhamento de contatos e propostas.
2. Cadastre uma nova oportunidade, informe serviço, valor e próximo passo.
3. Filtre por etapa, edite a oportunidade e marque-a como fechada.
4. Mostre a atualização dos indicadores e explique como a interface consulta a API e grava os dados no SQLite.

## Stack

HTML, CSS, JavaScript, Node.js e SQLite. A aplicação é intencionalmente independente de bibliotecas externas para deixar visível a implementação da interface, da API e da persistência.

## Descrição sugerida para o LinkedIn

**AtendeFlow — painel de oportunidades para pequenos negócios.** Desenvolvi uma aplicação Full-Stack para registrar contatos, acompanhar propostas e organizar próximos passos. Implementei uma interface responsiva, uma API em Node.js e persistência em SQLite. O projeto demonstra operações de cadastro, edição, busca, filtros, validação e indicadores de negociação.
