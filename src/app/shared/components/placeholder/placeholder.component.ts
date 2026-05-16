import { Component } from '@angular/core';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [],
  template: `
    <div class="ph">
      <span class="ph__icon"><i class="pi pi-wrench"></i></span>
      <h2>Módulo en construcción</h2>
      <p>Esta sección se construirá en las siguientes historias de usuario.</p>
    </div>
  `,
  styles: [
    `
      .ph {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        min-height: 60vh;
        text-align: center;
      }
      .ph__icon {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        background: var(--cd-blue-soft);
        color: var(--cd-blue);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.6rem;
        margin-bottom: 0.5rem;
      }
      h2 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--cd-ink);
      }
      p {
        margin: 0;
        font-size: 0.9rem;
        color: var(--cd-muted);
      }
    `,
  ],
})
export class PlaceholderComponent {}
