# switch

O `switch` escolhe um caminho entre vários valores:

```java
switch (opcao) {
    case 1 -> System.out.println("Um");
    case 2 -> System.out.println("Dois");
    default -> System.out.println("Outro");
}
```

## Tarefa
Dado `int diaDaSemana = 3;` (1 = Segunda-feira), imprima o nome do dia. Para 3, a saída deve ser `Quarta-feira`.
Cubra de 1 a 7 e use `default` para `Dia inválido`.
