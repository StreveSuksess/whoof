// Whoof media adapter; preserves the interface used by the original hero controller.
class VideoOverlay {
  private dialog!: HTMLDialogElement;
  private video!: HTMLVideoElement;
  preInit(): void {
    this.dialog = document.querySelector('#whoof-film')!;
    this.video = this.dialog.querySelector('video')!;
    document.querySelector('#whoof-film-close')!.addEventListener('click', () => this.dialog.close());
    this.dialog.addEventListener('close', () => this.video.pause());
    this.dialog.addEventListener('click', e => { if (e.target === this.dialog) this.dialog.close(); });
    const trigger = document.querySelector<HTMLElement>('#hero-video-wrapper')!;
    trigger.tabIndex = 0; trigger.setAttribute('role', 'button'); trigger.setAttribute('aria-label', 'Смотреть видео Whoof');
    trigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.initAndPlayVideo(); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.video.pause(); });
  }
  init(): void {}
  prefetch(): void {}
  resize(): void {}
  update(_dt: number): void {}
  initAndPlayVideo(): void {
    if (!this.video.getAttribute('src')) this.video.src = '/whoof/product-film.mp4';
    this.dialog.showModal();
    void this.video.play().catch(() => {});
  }
}
export const videoOverlay = new VideoOverlay();
