# Linked list (lista encadeada)

Uma lista encadeada guarda os elementos em **nós**. Cada nó tem um valor e uma referência para o **próximo** nó. O último aponta para `null`.

```java
class No {
    int valor;
    No proximo;

    No(int valor) {
        this.valor = valor;
    }
}

class Lista {
    No cabeca; // primeiro nó

    void adicionarNoFim(int valor) {
        No novo = new No(valor);
        if (cabeca == null) {
            cabeca = novo;
            return;
        }
        No atual = cabeca;
        while (atual.proximo != null) {
            atual = atual.proximo;
        }
        atual.proximo = novo;
    }
}
```

- **`cabeca`**: ponto de entrada da lista; `null` significa lista vazia.
- **Percorrer**: comece na `cabeca` e siga `proximo` até chegar em `null`.
- **Inserir no início**: o novo nó aponta para a antiga `cabeca` e vira a nova `cabeca`.

## Tarefa
1. Crie a classe `No` com `int valor` e `No proximo`, e um construtor que recebe o valor.
2. Crie a classe `Lista` com o campo `No cabeca` e os métodos:
   - `void adicionarNoFim(int valor)`
   - `void adicionarNoInicio(int valor)`
   - `int tamanho()`
   - `boolean contem(int valor)`
   - `String toString()` → valores separados por ` -> `, terminando em `null` (ex.: `10 -> 20 -> null`)
3. No `main`, crie uma `Lista`, adicione `10`, `20`, `30` no fim e imprima a lista.
4. Adicione `5` no início e imprima a lista.
5. Imprima `Tamanho: <n>`, `Contém 20: <true/false>` e `Contém 99: <true/false>`.
