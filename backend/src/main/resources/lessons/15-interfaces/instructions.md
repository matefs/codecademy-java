# Interfaces

Uma interface define **o que** uma classe sabe fazer, sem dizer **como**. Classes sem relação de herança podem implementar a mesma interface:

```java
interface Imprimivel {
    void imprimir();
}

class Relatorio implements Imprimivel {
    public void imprimir() { System.out.println("Relatório impresso"); }
}
```

## Tarefa
1. Crie a interface `Voador` com o método `void voar()`.
2. Crie `Passaro` implementando `Voador`, imprimindo `Pássaro batendo as asas`.
3. Crie `Aviao` implementando `Voador`, imprimindo `Avião ligando as turbinas`.
4. Na classe `Main`, crie `static void decolar(Voador voador)` que chama `voador.voar()`.
5. No `main`, chame `decolar` com um `Passaro` e depois com um `Aviao`.
