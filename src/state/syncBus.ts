/**
 * Ligação de sentido único entre "houve uma alteração local" e "sincroniza".
 *
 * Existe para a camada de dados não ter de conhecer a camada da conta: o
 * repositório apenas avisa que algo mudou, e quem sabe sincronizar decide o
 * quê e quando.
 */
type Handler = () => void;

let handler: Handler | null = null;

export function setLocalChangeHandler(next: Handler | null): void {
  handler = next;
}

export function notifyLocalChange(): void {
  handler?.();
}
