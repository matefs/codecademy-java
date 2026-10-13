# Classes e objetos

Uma classe é um molde; objetos são instâncias:

```java
class Gato {
    String nome;
    Gato(String nome) { this.nome = nome; }
    void miar() { System.out.println(nome + " diz: Miau!"); }
}
```

## Tarefa
1. Crie a classe `Cachorro` com o campo `nome` e um construtor que o recebe.
2. Crie o método `latir()` que imprime `<nome> diz: Au au!`.
3. No `main`, crie um `Cachorro` chamado `Rex` e chame `latir()`.
