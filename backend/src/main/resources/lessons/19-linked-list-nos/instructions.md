# Linked list: nós

Uma lista encadeada é feita de **nós**. Cada nó guarda duas coisas:

- um **valor** (aqui, um `int`);
- uma **referência para o próximo nó** (um campo do próprio tipo do nó).

O último nó não tem próximo: a referência dele fica `null`.

```
[10] -> [20] -> [30] -> null
```

Para visitar todos os nós, você começa no primeiro e vai pulando para o próximo até a referência ser `null`.

## Tarefa
1. Crie uma classe `No` com os campos `int valor` e `No proximo`, e um construtor que recebe o valor.
2. No `main`, crie três nós com os valores `10`, `20` e `30`.
3. Ligue os nós na ordem `10 -> 20 -> 30`.
4. Usando um `while`, percorra os nós a partir do primeiro, imprimindo cada valor em uma linha.
5. Conte quantos nós foram visitados e, no final, imprima `Total de nós: <n>`.
