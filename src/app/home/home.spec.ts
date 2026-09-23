import { TestBed } from '@angular/core/testing';
import { Home } from './home';

describe('Home', () => {
  it('should render the header', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Agentic Sales');
  });
});
