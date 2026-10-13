# Codecademy Java
<img width="2766" height="1550" alt="image" src="https://github.com/user-attachments/assets/a8e2165a-3e9d-4ebd-858c-8d733139062a" />

Plataforma local estilo Codecademy para praticar Java: lições com instruções, editor Monaco, execução do código e validação automática.

```
[React + Monaco :5173] --/api--> [Spring Boot :8080] --> javax.tools (compila in-process)
                                                    \--> java -Xmx128m Main (processo filho, timeout 5s)
```

## Pré-requisitos
- JDK 21+
- Maven 3.9+
- Node.js 20.19+ ou 22.12+ (exigência do Vite 7) e npm

## Rodar
- Tudo junto: `./run.sh` (instala dependências do frontend se faltar; Ctrl+C para os dois processos)
- Só o backend: `cd backend && mvn spring-boot:run` → http://127.0.0.1:8080
- Só o frontend: `cd frontend && npm install && npm run dev` → http://localhost:5173

## Testes
`cd backend && mvn test`

## Lições
| # | Tema |
|---|------|
| 01 | Olá, Mundo! |
| 02 | Variáveis |
| 03 | Operadores aritméticos |
| 04 | Métodos de String |
| 05 | if / else |
| 06 | switch |
| 07 | Laço for |
| 08 | Laço while |
| 09 | Arrays |
| 10 | Métodos |
| 11 | Classes e objetos |
| 12 | Herança |
| 13 | Polimorfismo |
| 14 | Encapsulamento |
| 15 | Interfaces |
| 16 | Composição |
| 17 | Sealed classes |
| 18 | Pattern matching |

## Nova lição
Criar `backend/src/main/resources/lessons/NN-slug/` com:
- `lesson.json`: `id` (igual ao nome da pasta), `order`, `title`, `hints[]`, `requiredCodePatterns[]` (`regex` + `failureMessage`)
- `instructions.md`: enunciado em Markdown
- `Starter.java`: código inicial (a classe pública deve se chamar `Main`)
- `expected_output.txt`: saída esperada

Uma submissão passa quando todos os `requiredCodePatterns` casam com o código e a saída é igual a `expected_output.txt` (ignorando espaços no fim das linhas e no início e fim do texto). As lições são carregadas na inicialização; reinicie o backend depois de adicionar ou editar uma lição.

## Configuração
Em `backend/src/main/resources/application.properties`:

| Propriedade | Padrão |
|---|---|
| `code-execution.run-timeout-millis` | 5000 |
| `code-execution.max-heap-megabytes` | 128 |
| `code-execution.max-output-bytes` | 65536 |
| `code-execution.max-concurrent-executions` | 4 |
| `code-execution.permit-acquire-timeout-millis` | 3000 |

## Segurança
O código enviado roda como processo filho, com as permissões do usuário do sistema operacional e sem sandbox de disco ou rede. Por isso o backend escuta só em `127.0.0.1`. **Não exponha na rede.**
