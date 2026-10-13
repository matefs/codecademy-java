# Encapsulamento

Encapsular é esconder o estado interno (`private`) e expor só operações que mantêm o objeto válido:

```java
class Termometro {
    private int temperatura;

    void ajustar(int novaTemperatura) {
        if (novaTemperatura < -273) return;
        temperatura = novaTemperatura;
    }

    int getTemperatura() { return temperatura; }
}
```

## Tarefa
1. Crie a classe `ContaBancaria` com o campo `private int saldo`.
2. Crie `depositar(int valor)`: ignora valores menores ou iguais a zero.
3. Crie `boolean sacar(int valor)`: retorna `false` sem alterar o saldo se o valor for menor ou igual a zero ou maior que o saldo; caso contrário, desconta e retorna `true`.
4. Crie `int getSaldo()`.
5. No `main`:
   - deposite `100`, depois tente depositar `-50`;
   - imprima `Saque de 30: <resultado de sacar(30)>`;
   - imprima `Saque de 500: <resultado de sacar(500)>`;
   - imprima `Saldo final: <getSaldo()>`.
