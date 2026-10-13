# Herança

Uma classe pode herdar campos e métodos de outra com `extends`. A subclasse chama o construtor da superclasse com `super(...)`:

```java
class Pessoa {
    String nome;

    Pessoa(String nome) {
        this.nome = nome;
    }

    void apresentar() {
        System.out.println("Olá, eu sou " + nome);
    }
}

class Aluno extends Pessoa {
    Aluno(String nome) {
        super(nome);
    }

    void estudar() {
        System.out.println(nome + " está estudando");
    }
}

public class Main {
    public static void main(String[] args) {
        Aluno ana = new Aluno("Ana");
        ana.apresentar(); // Olá, eu sou Ana      (herdado de Pessoa)
        ana.estudar();    // Ana está estudando   (próprio de Aluno)
    }
}
```

- `super(...)` precisa ser a **primeira linha** do construtor. Se a superclasse só tem construtor com parâmetros, a subclasse é obrigada a chamá-lo; senão não compila.
- A subclasse herda campos e métodos, mas não enxerga os que são `private` na superclasse.
- Java só permite herdar de **uma** classe por vez.

## Tarefa
1. Crie a classe `Veiculo` com o campo `marca`, um construtor que o recebe e o método `descrever()` que imprime `Veículo da marca <marca>`.
2. Crie a classe `Carro` que herda de `Veiculo`, com um construtor que chama `super(marca)`.
3. Em `Carro`, crie o método `buzinar()` que imprime `<marca> faz: Bi bi!`.
4. No `main`, crie um `Carro` da marca `Fiat` e chame `descrever()` e depois `buzinar()`.
