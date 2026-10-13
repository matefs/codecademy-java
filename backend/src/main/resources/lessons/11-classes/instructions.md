# Classes e objetos

Uma classe é um molde; objetos são instâncias:

```java
class Gato {
    String nome;

    Gato(String nome) {
        this.nome = nome;
    }

    void miar() {
        System.out.println(nome + " diz: Miau!");
    }
}

public class Main {
    public static void main(String[] args) {
        Gato mimi = new Gato("Mimi");
        Gato tom = new Gato("Tom");
        mimi.miar(); // Mimi diz: Miau!
        tom.miar();  // Tom diz: Miau!
    }
}
```

- O **construtor** tem o mesmo nome da classe e nenhum tipo de retorno; ele roda quando você faz `new Gato("Mimi")`.
- `this.nome` é o campo do objeto; `nome` sozinho é o parâmetro. Sem `this`, `nome = nome` atribui o parâmetro a ele mesmo e o campo fica `null`.
- Só pode haver uma classe `public` por arquivo (aqui, `Main`); as outras ficam no mesmo arquivo, sem `public`.

## Tarefa
1. Crie a classe `Cachorro` com o campo `nome` e um construtor que o recebe.
2. Crie o método `latir()` que imprime `<nome> diz: Au au!`.
3. No `main`, crie um `Cachorro` chamado `Rex` e chame `latir()`.
