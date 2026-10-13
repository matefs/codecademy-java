# Composição

Herança modela "é um". Composição modela "**tem um**": a classe guarda outro objeto como campo e delega trabalho a ele. Prefira composição quando não há relação real de "é um".

```java
class Bateria {
    void carregar() {
        System.out.println("Carregando");
    }
}

class Celular {
    private final Bateria bateria;

    Celular(Bateria bateria) {
        this.bateria = bateria;
    }

    void ligarNaTomada() {
        System.out.println("Cabo conectado");
        bateria.carregar();
    }
}

public class Main {
    public static void main(String[] args) {
        Celular celular = new Celular(new Bateria());
        celular.ligarNaTomada();
        // Cabo conectado
        // Carregando
    }
}
```

- Diferente da herança, `Celular` não ganha os métodos de `Bateria`: `celular.carregar()` não existe. Ele expõe só o que escolher (`ligarNaTomada`) e **delega** para a bateria.
- `final` garante que o campo é atribuído uma vez, no construtor, e nunca vira `null` depois.
- Receber a peça pelo construtor permite trocar a implementação (outra bateria, um motor elétrico) sem mexer na classe.

## Tarefa
1. Crie a classe `Motor` com o método `ligar()` que imprime `Motor ligado`.
2. Crie a classe `Carro` (sem `extends`) com o campo `private final Motor motor`, recebido no construtor.
3. Em `Carro`, crie `dirigir()`, que chama `motor.ligar()` e depois imprime `Carro em movimento`.
4. No `main`, crie `new Carro(new Motor())` e chame `dirigir()`.
