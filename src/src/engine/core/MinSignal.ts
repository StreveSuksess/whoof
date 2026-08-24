// Minimal port of the source MinSignal (add/addOnce/dispatch subset).

export class MinSignal<T = void> {
  private listeners: Array<{ fn: (payload: T) => void; once: boolean }> = [];

  add(fn: (payload: T) => void): void {
    this.listeners.push({ fn, once: false });
  }

  addOnce(fn: (payload: T) => void): void {
    this.listeners.push({ fn, once: true });
  }

  dispatch(payload: T): void {
    const current = this.listeners.slice();
    for (const listener of current) {
      listener.fn(payload);
      if (listener.once) {
        const i = this.listeners.indexOf(listener);
        if (i !== -1) this.listeners.splice(i, 1);
      }
    }
  }
}
