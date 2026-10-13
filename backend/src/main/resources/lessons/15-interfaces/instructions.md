# Interfaces

Uma interface define **o que** uma classe sabe fazer, sem dizer **como**. Classes sem relação de herança podem implementar a mesma interface:

```java
interface Imprimivel {
    void imprimir();
}

class Relatorio implements Imprimivel {
    public void imprimir() {
        System.out.println("Relatório impresso");
    }
}

class Foto implements Imprimivel {
    public void imprimir() {
        System.out.println("Foto impressa");
    }
}

public class Main {
    public static void main(String[] args) {
        Imprimivel documento = new Relatorio();
        documento.imprimir(); // Relatório impresso

        documento = new Foto();
        documento.imprimir(); // Foto impressa
    }
}
```

- Métodos de interface são implicitamente `public`. Por isso a implementação **precisa** ser `public void imprimir()`; sem `public`, não compila.
- Não dá para fazer `new Imprimivel()`; só de classes que a implementam. Mas uma variável ou parâmetro pode ter o tipo da interface.
- Uma classe herda de uma só classe, mas pode implementar várias interfaces: `class Pato implements Voador, Nadador`.

## Tarefa
1. Crie a interface `Voador` com o método `void voar()`.
2. Crie `Passaro` implementando `Voador`, imprimindo `Pássaro batendo as asas`.
3. Crie `Aviao` implementando `Voador`, imprimindo `Avião ligando as turbinas`.
4. Na classe `Main`, crie `static void decolar(Voador voador)` que chama `voador.voar()`.
5. No `main`, chame `decolar` com um `Passaro` e depois com um `Aviao`.
