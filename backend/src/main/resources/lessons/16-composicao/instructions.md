# Composição

Herança modela "é um". Composição modela "**tem um**": a classe guarda outro objeto como campo e delega trabalho a ele. Prefira composição quando não há relação real de "é um".

```java
class Bateria {
    void carregar() { System.out.println("Carregando"); }
}

class Celular {
    private final Bateria bateria;
    Celular(Bateria bateria) { this.bateria = bateria; }
    void ligarNaTomada() { bateria.carregar(); }
}
```

## Tarefa
1. Crie a classe `Motor` com o método `ligar()` que imprime `Motor ligado`.
2. Crie a classe `Carro` (sem `extends`) com o campo `private final Motor motor`, recebido no construtor.
3. Em `Carro`, crie `dirigir()`, que chama `motor.ligar()` e depois imprime `Carro em movimento`.
4. No `main`, crie `new Carro(new Motor())` e chame `dirigir()`.
