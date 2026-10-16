# AtendeFlow

Aplicação Full-Stack para organizar contatos, oportunidades e próximos passos de pequenos negócios.

## Problema

Conversas comerciais espalhadas em mensagens e anotações tornam fácil esquecer retornos e perder a visão das propostas em andamento. O AtendeFlow reúne essas informações em um painel simples, executado localmente e sem serviços externos.

## Funcionalidades

- Cadastro, consulta, edição e exclusão de oportunidades.
- Busca por nome, empresa ou serviço.
- Filtro por etapa da negociação.
- Próxima ação e data de acompanhamento.
- Indicadores de contatos, valor em aberto e negócios fechados.
- Validação de campos no servidor e mensagens de erro na interface.
- Interface responsiva e formulários acessíveis.
- Persistência local em SQLite.

## Tecnologias

- HTML5, CSS e JavaScript.
- Node.js 24 com servidor HTTP nativo.
- SQLite por meio do módulo `node:sqlite`.
- Node Test Runner para testes automatizados.

O projeto não depende de pacotes de terceiros.

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

## Fluxo de demonstração

1. Observe os indicadores do painel.
2. Cadastre uma oportunidade com serviço, valor e próximo passo.
3. Filtre por etapa e edite o registro.
4. Marque a oportunidade como fechada e confira a atualização dos indicadores.

## Estado do projeto

Projeto funcional de estudo e portfólio. Os contatos incluídos inicialmente são dados fictícios e servem apenas para demonstração local.


