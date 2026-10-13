# Codecademy Java

```
[React + Monaco :5173] --/api--> [Spring Boot :8080] --> javax.tools (compila in-process)
                                                    \--> java -Xmx128m Main (processo filho, timeout 5s)
```

## Rodar
- Backend: `cd backend && mvn spring-boot:run` (JDK 21+)
- Frontend: `cd frontend && npm install && npm run dev` → http://localhost:5173

## Nova lição
Criar `backend/src/main/resources/lessons/NN-slug/` com `lesson.json`, `instructions.md`, `Starter.java`, `expected_output.txt`.
