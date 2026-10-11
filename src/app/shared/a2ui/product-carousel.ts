import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, linkedSignal } from '@angular/core';
import { Product } from '@shared/a2ui/product-carousel-schema';

@Component({
  selector: 'app-product-carousel',
  imports: [CurrencyPipe],
  template: `
    @let items = products() ?? [];
    <section aria-roledescription="carousel" aria-label="Products">
      <button type="button" aria-label="Previous product" (click)="move(-1)">
        <img src="icons/chevron-left.svg" width="16" height="16" alt="" />
      </button>
      <div class="viewport">
        <ul [style.transform]="offset()">
          @for (product of items; track $index) {
            <li [inert]="$index !== index()">
              <img [src]="product.imageUrl" width="160" height="160" alt="" />
              <h3>{{ product.name }}</h3>
              <p>Revenue: {{ product.revenue | currency }}</p>
              <p>Total: {{ total() | currency }}</p>
              <div class="timer" (animationend)="move(1)"></div>
            </li>
          }
        </ul>
      </div>
      <button type="button" aria-label="Next product" (click)="move(1)">
        <img src="icons/chevron-right.svg" width="16" height="16" alt="" />
      </button>
    </section>
    <p class="position">{{ index() + 1 }} / {{ items.length }}</p>
  `,
})
export class ProductCarousel {
  readonly products = input<Product[]>();

  protected readonly index = linkedSignal({
    source: this.products,
    computation: () => 0,
  });
  protected readonly total = computed(() => totalRevenue(this.products()));
  protected readonly offset = computed(
    () => `translateX(${this.index() * -100}%)`,
  );

  protected move(step: number): void {
    const count = this.products()?.length ?? 0;
    this.index.update((index) => (index + step + count) % Math.max(count, 1));
  }
}

function totalRevenue(products: Product[] = []): number {
  return products.reduce((sum, product) => sum + product.revenue, 0);
}
